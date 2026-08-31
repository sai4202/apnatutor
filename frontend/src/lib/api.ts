/**
 * Single place that knows where the backend lives.
 *
 * The value comes from the repo-root .env via next.config.ts. Nothing else in the app should read
 * process.env for the API location — import from here instead, so the day it moves it moves once.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

/**
 * Actuator lives at the server root, not under /api/v1, so we derive the origin.
 */
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

/**
 * The uniform error shape every endpoint returns (SOURCE_OF_TRUTH.md section 6).
 *
 * `code` is a stable machine enum — switch on it. `message` is for humans and may be reworded at
 * any time, so never branch on it.
 */
export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError,
  ) {
    super(body.message);
    this.name = "ApiRequestError";
  }
}

/**
 * Thin fetch wrapper: resolves the URL, sends JSON, and turns a non-2xx response into a typed
 * error rather than leaving the caller to inspect `res.ok` every time.
 *
 * `credentials: "include"` is needed for the refresh-token cookie in M1, and is why the backend
 * CORS config names an explicit origin instead of using a wildcard.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      code: "UNKNOWN",
      message: `Request failed with status ${res.status}`,
    }))) as ApiError;
    throw new ApiRequestError(res.status, body);
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export type HealthStatus = "UP" | "DOWN" | "UNREACHABLE";

export interface BackendHealth {
  status: HealthStatus;
  database: HealthStatus;
  detail?: string;
}

/**
 * Reads Spring Actuator's health endpoint.
 *
 * Never throws: an unreachable backend is an expected state during development, and the page
 * should say so plainly rather than crash. `no-store` because a cached health check is worthless.
 */
export async function fetchBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/actuator/health`, {
      cache: "no-store",
    });
    const body = await res.json();

    return {
      status: body.status === "UP" ? "UP" : "DOWN",
      database: body.components?.db?.status === "UP" ? "UP" : "DOWN",
    };
  } catch (error) {
    return {
      status: "UNREACHABLE",
      database: "UNREACHABLE",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
