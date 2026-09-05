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
 * How long a server-rendered request waits for the backend before giving up.
 *
 * This exists because fetch() has no default timeout. A host that refuses the
 * connection fails instantly, and the catch blocks below then do their job. But a
 * host that silently drops the packets leaves the request pending forever, and
 * nothing is ever thrown for a catch to catch. A build container reaching for a
 * backend that is not running is exactly that second case.
 *
 * Next.js allows a page 60 seconds to render, so such a hang does not merely
 * degrade one page, it fails the whole build. Aborting turns the hang into an
 * ordinary error, every caller falls back to its empty state, and an absent
 * backend costs a sparse page instead of a broken deployment.
 *
 * Eight seconds is far longer than a healthy call and far shorter than the 60s
 * budget, which leaves room for several sequential fetches on a single page.
 */
const SERVER_FETCH_TIMEOUT_MS = 8000;

/**
 * The uniform error shape every endpoint returns (SOURCE_OF_TRUTH.md section 6).
 *
 * `code` is a stable machine enum — switch on it. `message` is for humans and may be reworded at
 * any time, so never branch on it.
 */
/**
 * A nullable field from this API is **absent**, not null.
 *
 * The backend sets `default-property-inclusion: non_null`, so Jackson omits every null rather than
 * serialising it. That makes `field !== null` a bug: `undefined !== null` is true, so the guard
 * passes and the next line reads a property of undefined. It cost the city x subject SEO pages a
 * 500 the first time an unrated tutor appeared in results — caught by an end-to-end test, because
 * every type here says `| null` and TypeScript therefore believes the strict check is sound.
 *
 * Use `!= null` (loose) for anything that came off the wire. It catches both.
 */

/**
 * A nullable field from this API is **absent**, not null.
 *
 * The backend sets `default-property-inclusion: non_null`, so Jackson omits every null rather
 * than serialising it. That makes `field !== null` a bug: `undefined !== null` is true, so the
 * guard passes and the next line reads a property of undefined. It cost the city × subject SEO
 * pages a 500 the first time an unrated tutor appeared in results — found by an end-to-end test,
 * because every type here says `| null` and TypeScript therefore believes the strict check sound.
 *
 * Use `!= null` (loose) for anything that came off the wire. It catches both.
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
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
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
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
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
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
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
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
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
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
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
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicReview[];
  } catch {
    return [];
  }
}

/**
 * Adapts a search result to the shape {@link TutorCard} renders.
 *
 * Lives here rather than in the component because two callers need it — the homepage strip and
 * anywhere else that reuses the card — and a second copy of this mapping is a second place for the
 * fee unit or the verified flag to be read wrong.
 *
 * `locality` and `city` are both taken from the one locality string the search projection carries.
 * The card shows them together, and the API does not split them: a tutor's searchable area is one
 * value, and inventing a split here would guess wrong for online-only tutors.
 */
export function toTutorSummary(result: TutorSearchResult): {
  name: string;
  headline: string;
  subjects: string[];
  rating: number;
  reviewCount: number;
  feeFromPaise: number;
  feeUnit: "PER_HOUR" | "PER_MONTH";
  locality: string;
  city: string;
  experienceYears: number;
  verified: boolean;
  modes: ("STUDENT_HOME" | "TUTOR_PLACE" | "ONLINE")[];
} {
  return {
    name: result.displayName ?? "Tutor",
    headline: result.headline ?? "",
    subjects: result.subjects,
    // Zero rather than null: the card renders stars, and an unrated tutor shows none. The
    // review count beside it is what tells a reader the difference between "no reviews" and
    // "reviewed badly", which is why both are passed rather than one derived number.
    rating: result.avgRating ?? 0,
    reviewCount: result.reviewCount,
    feeFromPaise: result.feeMinPaise ?? 0,
    feeUnit: result.feeUnit ?? "PER_MONTH",
    locality: result.locality ?? "",
    city: result.locality ?? "",
    experienceYears: result.experienceYears,
    verified: result.idVerified,
    modes: result.teachingModes as ("STUDENT_HOME" | "TUTOR_PLACE" | "ONLINE")[],
  };
}
