import type { APIRequestContext } from "@playwright/test";

/**
 * Shared helpers for the end-to-end tests.
 *
 * <p>Sign-in goes through the API rather than the login form. The form is exercised once, by its
 * own test; doing it again before every other test would make each of them fail for two reasons
 * and slow the suite down for no extra coverage.
 */

// 127.0.0.1, not "localhost". Playwright's request context resolves localhost to ::1 first, and
// the backend binds IPv4 only, so the name form fails with ECONNREFUSED while a browser hitting
// the same URL works fine — a confusing way to lose an afternoon.
export const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8080/api/v1";

/** Seeded by DevAccountSeeder. These bypass SMS and accept the fixed dev code. */
export const DEV_STUDENT = "9999900001";
export const DEV_TUTOR = "9999900002";
export const DEV_ADMIN = "9999900003";

export interface Session {
  accessToken: string;
  user: { id: number; role: string };
}

/**
 * Signs in through the OTP flow, using dev mode's fixed code.
 *
 * <p>This only works because the backend is in dev mode, which is stated loudly in the config and
 * guarded by {@code DevModeGuard} in the application itself — a production build cannot be driven
 * this way, which is the point.
 */
export async function signIn(
  request: APIRequestContext,
  phone: string,
  role = "STUDENT",
): Promise<Session> {
  const requested = await request.post(`${API}/auth/otp/request`, {
    data: { phone },
  });
  if (!requested.ok()) {
    throw new Error(
      `OTP request failed for ${phone} (${requested.status()}). Is the backend running in dev mode?`,
    );
  }

  // Dev mode returns the code it generated. In any real deployment this field is absent from the
  // JSON entirely, so a test written this way cannot accidentally run against production.
  const body = await requested.json();
  const code = body.devCode ?? "123456";

  const verified = await request.post(`${API}/auth/otp/verify`, {
    data: { phone, code, role },
  });
  if (!verified.ok()) {
    throw new Error(`OTP verify failed for ${phone}: ${await verified.text()}`);
  }

  return (await verified.json()) as Session;
}

/** A fresh phone number, so a test that registers an account never collides with another run. */
export function freshPhone(): string {
  const suffix = String(Math.floor(Math.random() * 900_000) + 100_000);
  return `98${String(Date.now()).slice(-4)}${suffix.slice(0, 4)}`;
}
