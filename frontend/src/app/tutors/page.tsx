import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchCities,
  fetchLeafSubjects,
  searchTutors,
  type SearchParams,
} from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { SearchResultCard } from "@/components/SearchResultCard";
import { ButtonLink, Container, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Find a tutor",
  description:
    "Search verified home and online tutors by subject, city and locality.",
};

/**
 * Search results.
 *
 * <p>A Server Component with a plain GET form: filters live in the URL, so a
 * result page is shareable, the back button works, and a crawler can follow the
 * links. None of that survives if filtering is client state.
 *
 * <p>Rendered per request rather than cached — results change as tutors publish
 * and edit, and a parent contacting a tutor who has since gone offline blames
 * us, not the cache.
 */
export const dynamic = "force-dynamic";

const FILTERS = [
  {
    param: "mode",
    label: "How you learn",
    options: [
      { value: "STUDENT_HOME", label: "At my home" },
      { value: "TUTOR_PLACE", label: "At tutor's place" },
      { value: "ONLINE", label: "Online" },
    ],
  },
  {
    param: "verifiedOnly",
    label: "Trust",
    options: [{ value: "true", label: "Verified tutors only" }],
  },
];

const SORTS = [
  { value: "RELEVANCE", label: "Best match" },
  { value: "RATING", label: "Highest rated" },
  { value: "FEE_LOW_TO_HIGH", label: "Lowest fee" },
  { value: "EXPERIENCE", label: "Most experienced" },
];

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [results, cities, subjects] = await Promise.all([
    searchTutors(params),
    fetchCities(),
    fetchLeafSubjects(),
  ]);

  const cityName = cities.find((c) => c.slug === params.location)?.name;
  const subjectName = subjects.find((s) => s.slug === params.subject)?.name;
  const described = [subjectName ?? params.q, cityName]
    .filter(Boolean)
    .join(" in ");

  /** Preserves current filters while changing one, so links compose. */
  function withParam(key: string, value: string | undefined) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== "page") next.set(k, v);
    }
    if (value === undefined || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    return `/tutors?${next.toString()}`;
  }

  return (
    <>
      <Container className="pt-5 sm:pt-6">
        <section className="panel bg-brand-wash px-6 py-10 sm:px-10">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {described ? `Tutors for ${described}` : "Find a tutor"}
          </h1>
          {results.totalElements > 0 && (
            <p className="mt-2 text-ink-600">
              {results.totalElements}{" "}
              {results.totalElements === 1 ? "tutor" : "tutors"} available
            </p>
          )}
          <div className="mt-6 max-w-3xl">
            <SearchBar
              cities={cities}
              defaultSubject={params.q ?? ""}
              defaultCity={params.location ?? ""}
            />
          </div>
        </section>
      </Container>

      <Container className="py-5 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          {/* Filters are links, not checkboxes, so they work without JavaScript
              and each combination has its own shareable URL. */}
          <aside>
            <div className="panel bg-white p-5 ring-1 ring-ink-200/70">
              <details open>
                <summary className="cursor-pointer font-semibold lg:pointer-events-none">
                  Filters
                </summary>

                <div className="mt-4 space-y-6">
                  {FILTERS.map((group) => (
                    <div key={group.param}>
                      <h2 className="text-sm font-semibold text-ink-900">
                        {group.label}
                      </h2>
                      <ul className="mt-2.5 space-y-1.5">
                        {group.options.map((option) => {
                          const active =
                            params[group.param as keyof SearchParams] ===
                            option.value;
                          return (
                            <li key={option.value}>
                              <Link
                                href={withParam(group.param, option.value)}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                                  active
                                    ? "bg-brand-50 font-medium text-brand-700"
                                    : "text-ink-600 hover:bg-ink-50"
                                }`}
                              >
                                <span
                                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                                    active
                                      ? "border-brand-600 bg-brand-600 text-white"
                                      : "border-ink-300"
                                  }`}
                                >
                                  {active && (
                                    <Icon name="check" className="h-3 w-3" />
                                  )}
                                </span>
                                {option.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}

                  <div>
                    <h2 className="text-sm font-semibold text-ink-900">Sort by</h2>
                    <ul className="mt-2.5 space-y-1.5">
                      {SORTS.map((option) => {
                        const active =
                          (params.sort ?? "RELEVANCE") === option.value;
                        return (
                          <li key={option.value}>
                            <Link
                              href={withParam("sort", option.value)}
                              className={`block rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                                active
                                  ? "bg-brand-50 font-medium text-brand-700"
                                  : "text-ink-600 hover:bg-ink-50"
                              }`}
                            >
                              {option.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          </aside>

          <div>
            {results.content.length > 0 ? (
              <>
                <div className="space-y-4">
                  {results.content.map((tutor) => (
                    <SearchResultCard key={tutor.id} tutor={tutor} />
                  ))}
                </div>

                {results.totalPages > 1 && (
                  <nav
                    className="mt-8 flex items-center justify-center gap-2"
                    aria-label="Pagination"
                  >
                    {Array.from({ length: Math.min(results.totalPages, 10) }).map(
                      (_, index) => {
                        const next = new URLSearchParams();
                        for (const [k, v] of Object.entries(params)) {
                          if (v && k !== "page") next.set(k, v);
                        }
                        if (index > 0) next.set("page", String(index));
                        const active = results.page === index;
                        return (
                          <Link
                            key={index}
                            href={`/tutors?${next.toString()}`}
                            aria-current={active ? "page" : undefined}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                              active
                                ? "bg-brand-600 text-white"
                                : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-brand-50"
                            }`}
                          >
                            {index + 1}
                          </Link>
                        );
                      },
                    )}
                  </nav>
                )}
              </>
            ) : (
              /* Honest, and routed to the action that does work. A parent who
                 finds nothing and leaves is lost; one who posts a requirement is
                 a lead the moment supply arrives. */
              <div className="panel bg-white p-10 text-center ring-1 ring-ink-200/70 sm:p-14">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon name="search" className="h-7 w-7" />
                </span>
                <h2 className="mt-6 text-xl font-semibold">
                  No tutors match that yet
                </h2>
                <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-600">
                  We are still onboarding and verifying tutors
                  {cityName ? ` in ${cityName}` : ""}. Post your requirement and
                  we will connect you the moment a match joins.
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <ButtonLink href="/post-requirement" size="lg">
                    Post your requirement
                    <Icon name="arrow" className="h-5 w-5" />
                  </ButtonLink>
                  <ButtonLink href="/tutors" variant="secondary" size="lg">
                    Clear filters
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
