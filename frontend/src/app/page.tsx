import Link from "next/link";
import { fetchCities, fetchSubjectTree } from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import {
  Badge,
  ButtonLink,
  Card,
  Container,
  Icon,
  SectionHeading,
} from "@/components/ui";

/**
 * Landing page.
 *
 * A Server Component with no client JavaScript at all: every element here is
 * static markup or a plain form. That is not minimalism for its own sake — this
 * page has to render completely for a crawler and load fast on a mid-range
 * Android phone on a patchy connection, which is the typical Indian visitor.
 *
 * Catalog data is fetched with hourly revalidation, so the page is served from
 * cache rather than hitting the backend on every visit.
 */
export const revalidate = 3600;

const STEPS = [
  {
    icon: "search" as const,
    title: "Tell us what you need",
    body: "Subject, class, your area, and your budget. Takes under a minute, and it is completely free.",
  },
  {
    icon: "users" as const,
    title: "Tutors reach out to you",
    body: "Verified tutors near you see your requirement and get in touch. You never chase anyone.",
  },
  {
    icon: "check" as const,
    title: "Choose who fits",
    body: "Compare profiles, qualifications and reviews. Take a demo class before you commit.",
  },
];

const TRUST = [
  {
    icon: "shield" as const,
    title: "Every tutor is verified",
    body: "Phone, ID and qualifications are checked by our team before a profile goes live.",
  },
  {
    icon: "wallet" as const,
    title: "You pay your tutor directly",
    body: "ApnaTutor never touches your tuition fees. No commission, no platform cut, no surprises.",
  },
  {
    icon: "users" as const,
    title: "At most 5 tutors contact you",
    body: "We cap responses per requirement, so your phone does not turn into a call centre.",
  },
];

export default async function Home() {
  const [subjectTree, cities] = await Promise.all([
    fetchSubjectTree(),
    fetchCities(),
  ]);

  const categories = subjectTree.slice(0, 6);

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-brand-wash">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        {/* Fades the grid into the white page below so the section does not
            end on a hard line. */}
        <div
          className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white"
          aria-hidden="true"
        />

        <Container className="relative py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="brand">
              <Icon name="location" className="h-3.5 w-3.5" />
              Home &amp; online tuition across India
            </Badge>

            <h1 className="mt-6 text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
              Find the right tutor,{" "}
              <span className="text-brand-600">right near you</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-600 sm:text-xl">
              Apna tutor, apne ghar ke paas. Post what you need for free, and
              verified tutors in your area will reach out to you.
            </p>

            <div className="mx-auto mt-9 max-w-3xl">
              <SearchBar cities={cities} />
            </div>

            <p className="mt-4 text-sm text-ink-500">
              Free for students and parents. Always.
            </p>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How it works                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            centered
            eyebrow="How it works"
            title="Three steps, no chasing"
            description="Most parents hear from a tutor within a few hours of posting."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <Card key={step.title} className="p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name={step.icon} className="h-5.5 w-5.5" />
                  </span>
                  <span className="text-sm font-semibold text-ink-400">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-600">{step.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Subject categories                                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-y border-ink-200 bg-ink-50 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Browse"
            title="What would you like to learn?"
            description="From school tuition and entrance exams to music, languages and code."
          />

          {categories.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.slug} interactive className="p-6">
                  <h3 className="text-lg font-semibold text-ink-900">
                    {category.name}
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {category.children.slice(0, 6).map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/tutors?q=${child.slug}`}
                          className="inline-block rounded-lg bg-white px-3 py-1.5 text-sm text-ink-700 ring-1 ring-ink-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/tutors?category=${category.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    View all
                    <Icon name="arrow" className="h-4 w-4" />
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            /* The backend is unreachable. The page still renders and still
               converts — the search bar and CTA above do not depend on this. */
            <p className="mt-10 rounded-xl bg-white p-6 text-ink-500 ring-1 ring-ink-200">
              Subject categories are loading. Try the search above in the meantime.
            </p>
          )}
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Trust                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            centered
            eyebrow="Why parents trust us"
            title="You are letting someone into your home"
            description="So we take verification, and your privacy, seriously."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TRUST.map((item) => (
              <div key={item.title} className="text-center">
                <span className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-[var(--shadow-brand)]">
                  <Icon name={item.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-xs leading-relaxed text-ink-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Cities — also internal linking for the M2 SEO pages                */}
      {/* ---------------------------------------------------------------- */}
      {cities.length > 0 && (
        <section className="pb-16 sm:pb-20">
          <Container>
            <h2 className="text-2xl font-bold">Tutors in your city</h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/tutors/${city.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-700 ring-1 ring-ink-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-300"
                >
                  <Icon name="location" className="h-4 w-4 text-ink-400" />
                  {city.name}
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Split CTA — the two audiences, side by side                       */}
      {/* ---------------------------------------------------------------- */}
      <section className="pb-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-brand-600 p-9 text-white sm:p-11">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Looking for a tutor?
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-brand-100">
                Post your requirement in under a minute. It is free, and verified
                tutors near you will get in touch.
              </p>
              <ButtonLink
                href="/post-requirement"
                variant="secondary"
                size="lg"
                className="mt-7"
              >
                Post a requirement
                <Icon name="arrow" className="h-5 w-5" />
              </ButtonLink>
            </div>

            <div className="rounded-2xl bg-ink-900 p-9 text-white sm:p-11">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Are you a tutor?
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-ink-300">
                Get student enquiries from your own area. Create a profile free,
                and only pay when you choose to respond to one.
              </p>
              <ButtonLink
                href="/for-tutors"
                variant="secondary"
                size="lg"
                className="mt-7"
              >
                Start teaching
                <Icon name="arrow" className="h-5 w-5" />
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
