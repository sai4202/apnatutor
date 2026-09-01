import type { Metadata } from "next";
import Link from "next/link";
import { fetchCities, fetchSubjectTree } from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { Badge, ButtonLink, Card, Container, Icon } from "@/components/ui";

export const metadata: Metadata = {
  title: "Find a tutor",
  description:
    "Search verified home and online tutors by subject, city and locality.",
};

export const revalidate = 3600;

/**
 * Search results.
 *
 * The filter sidebar and result layout are real; the results themselves are not
 * — tutor search is M2-01, and there are no tutor profiles in the database until
 * M1-08. Rather than fake tutor cards, this renders an honest empty state that
 * routes the visitor to the action that actually works today: posting a
 * requirement.
 *
 * That is also the better funnel. A parent who finds no tutors and leaves is
 * lost; a parent who posts a requirement is a lead the moment supply arrives.
 */

const FILTER_GROUPS = [
  {
    label: "Mode",
    options: ["At my home", "At tutor's place", "Online"],
  },
  {
    label: "Budget (per month)",
    options: ["Under ₹2,000", "₹2,000 – ₹5,000", "₹5,000 – ₹10,000", "₹10,000+"],
  },
  {
    label: "Board",
    options: ["CBSE", "ICSE", "State Board", "IB / IGCSE"],
  },
  {
    label: "Tutor gender",
    options: ["Any", "Female", "Male"],
  },
];

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const params = await searchParams;
  const [cities, subjectTree] = await Promise.all([
    fetchCities(),
    fetchSubjectTree(),
  ]);

  const cityName = cities.find((c) => c.slug === params.city)?.name;
  const popular = subjectTree.flatMap((c) => c.children).slice(0, 10);

  const describedSearch = [params.q, cityName].filter(Boolean).join(" in ");

  return (
    <>
      <Container className="pt-5 sm:pt-6">
        <section className="panel bg-brand-wash px-6 py-10 sm:px-10">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {describedSearch ? `Tutors for ${describedSearch}` : "Find a tutor"}
          </h1>
          <div className="mt-6 max-w-3xl">
            <SearchBar
              cities={cities}
              defaultSubject={params.q ?? ""}
              defaultCity={params.city ?? ""}
            />
          </div>
        </section>
      </Container>

      <Container className="py-5 sm:py-6">
        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          {/* Filters. A details element on mobile so they collapse out of the
              way, always open from lg up where there is room. */}
          <aside>
            <details open className="lg:open">
              <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-ink-50 px-4 py-3 font-semibold lg:hidden">
                Filters
                <Icon name="arrow" className="h-4 w-4 rotate-90" />
              </summary>

              <div className="mt-4 space-y-7 lg:mt-0">
                {FILTER_GROUPS.map((group) => (
                  <div key={group.label}>
                    <h2 className="text-sm font-semibold text-ink-900">
                      {group.label}
                    </h2>
                    <ul className="mt-3 space-y-2.5">
                      {group.options.map((option) => (
                        <li key={option}>
                          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-600 hover:text-ink-900">
                            <input
                              type="checkbox"
                              disabled
                              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-600"
                            />
                            {option}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <p className="rounded-lg bg-ink-50 p-3 text-xs leading-relaxed text-ink-500">
                  Filters activate with tutor search in M2.
                </p>
              </div>
            </details>
          </aside>

          <div>
            {/* Honest empty state. No fabricated tutor cards — a demo that looks
                populated but is not makes it impossible to tell real progress
                from a mockup. */}
            <Card className="p-10 text-center sm:p-14">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name="search" className="h-7 w-7" />
              </span>
              <h2 className="mt-6 text-xl font-semibold">
                No tutors listed yet
              </h2>
              <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-600">
                We are onboarding and verifying tutors
                {cityName ? ` in ${cityName}` : ""} right now. Post your
                requirement and we will connect you the moment a match joins.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/post-requirement" size="lg">
                  Post your requirement
                  <Icon name="arrow" className="h-5 w-5" />
                </ButtonLink>
                <ButtonLink href="/for-tutors" variant="secondary" size="lg">
                  I am a tutor
                </ButtonLink>
              </div>
              <p className="mt-5 text-sm text-ink-500">
                Free for students and parents.
              </p>
            </Card>

            {popular.length > 0 && (
              <div className="mt-10">
                <h2 className="text-lg font-semibold">Popular subjects</h2>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {popular.map((subject) => (
                    <Link
                      key={subject.slug}
                      href={`/tutors?q=${subject.slug}`}
                      className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-700 ring-1 ring-ink-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-300"
                    >
                      {subject.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center gap-3 rounded-xl bg-ink-50 p-5 ring-1 ring-ink-200">
              <Badge tone="neutral">In progress</Badge>
              <p className="text-sm text-ink-600">
                Search, filters and tutor profiles ship in M2 — see{" "}
                <code className="rounded bg-white px-1.5 py-0.5 text-xs ring-1 ring-ink-200">
                  docs/TASKS.md
                </code>
                .
              </p>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
