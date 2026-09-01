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

/* -------------------------------------------------------------------------- */
/* Catalog                                                                     */
/* -------------------------------------------------------------------------- */

export interface SubjectNode {
  id: number;
  name: string;
  slug: string;
  leaf: boolean;
  children: SubjectNode[];
}

export interface City {
  id: number;
  name: string;
  state: string;
  slug: string;
}

/**
 * Fetches the subject tree.
 *
 * Revalidated hourly rather than fetched per request: this is reference data
 * that changes maybe monthly, and it is needed on nearly every page. `next.revalidate`
 * lets the whole page stay statically rendered, which is what makes the SEO
 * landing pages fast.
 *
 * Returns an empty array rather than throwing if the backend is down — a
 * degraded homepage is better than an error page, and the sections that depend
 * on this render their own empty state.
 */
export async function fetchSubjectTree(): Promise<SubjectNode[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/catalog/subjects`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as SubjectNode[];
  } catch {
    return [];
  }
}

export async function fetchCities(): Promise<City[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/catalog/cities`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as City[];
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

export interface TutorSearchResult {
  id: number;
  displayName: string | null;
  headline: string | null;
  photoUrl: string | null;
  experienceYears: number;
  feeMinPaise: number | null;
  feeMaxPaise: number | null;
  feeUnit: "PER_HOUR" | "PER_MONTH" | null;
  feeNegotiable: boolean;
  teachingModes: string[];
  subjects: string[];
  locality: string | null;
  avgRating: number | null;
  reviewCount: number;
  idVerified: boolean;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SearchParams {
  q?: string;
  subject?: string;
  location?: string;
  mode?: string;
  verifiedOnly?: string;
  sort?: string;
  page?: string;
}

/**
 * Runs a tutor search.
 *
 * Returns an empty page rather than throwing if the backend is unreachable, so
 * the results page renders its empty state instead of an error screen. A visitor
 * who sees "no tutors yet" can still post a requirement; one who sees a stack
 * trace leaves.
 *
 * Not cached: results change as tutors publish and edit, and a parent contacting
 * a tutor who has since gone offline blames us, not the cache.
 */
export async function searchTutors(
  params: SearchParams,
): Promise<Page<TutorSearchResult>> {
  const empty: Page<TutorSearchResult> = {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  };

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/public/tutors?${query}`, {
      cache: "no-store",
    });
    if (!res.ok) return empty;
    return (await res.json()) as Page<TutorSearchResult>;
  } catch {
    return empty;
  }
}

export interface PublicTutorProfile {
  id: number;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  gender: string | null;
  experienceYears: number;
  feeMinPaise: number | null;
  feeMaxPaise: number | null;
  feeUnit: "PER_HOUR" | "PER_MONTH" | null;
  feeNegotiable: boolean;
  teachingModes: string[];
  languages: string[];
  offersDemo: boolean;
  availabilityNote: string | null;
  subjects: { subjectId: number; name: string; slug: string | null }[];
  locations: { locationId: number; displayName: string }[];
  qualifications: {
    id: number;
    degree: string;
    institution: string;
    year: number | null;
    verified: boolean;
  }[];
  avgRating: number | null;
  reviewCount: number;
  verificationLevel: string;
  verifiedBadges: string[];
}

/** A published tutor's public profile. Null for an unknown or unpublished one. */
export async function fetchTutorProfile(
  id: number,
): Promise<PublicTutorProfile | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/tutors/${id}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicTutorProfile;
  } catch {
    return null;
  }
}

/** Resolves a city slug to its display name, for page titles and headings. */
export async function fetchCity(slug: string): Promise<City | null> {
  const cities = await fetchCities();
  return cities.find((city) => city.slug === slug) ?? null;
}

/** Flattens the subject tree, for SEO page generation and slug lookups. */
export async function fetchLeafSubjects(): Promise<
  { id: number; name: string; slug: string; category: string }[]
> {
  const tree = await fetchSubjectTree();
  return tree.flatMap((category) =>
    category.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      category: category.name,
    })),
  );
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

/* -------------------------------------------------------------------------- */
/* Reviews                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A published review, exactly as the public endpoint serves it.
 *
 * Note what is not here: no student id, no moderation status. The backend serves
 * approved reviews only and its public record has no field for either, so there
 * is nothing for this client to filter — which is the point. A client-side
 * filter is one render away from being forgotten.
 */
export interface PublicReview {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  /** Masked: "Priya S.", never a full name. */
  reviewerName: string;
  createdAt: string;
  /** Present only once the tutor's reply has been approved too. */
  tutorReply: string | null;
  tutorRepliedAt: string | null;
}

/**
 * Published reviews for a tutor profile.
 *
 * Returns an empty list rather than throwing: a profile page that renders
 * without its reviews is still useful, and one that 500s because the reviews
 * call failed is not. Revalidated on the same 5-minute cycle as the profile
 * itself, so the rating in the header and the reviews below it stay in step.
 */
export async function fetchTutorReviews(id: number): Promise<PublicReview[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/tutors/${id}/reviews`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicReview[];
  } catch {
    return [];
  }
}
