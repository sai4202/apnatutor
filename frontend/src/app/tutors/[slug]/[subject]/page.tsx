import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchCities,
  fetchLeafSubjects,
  searchTutors,
} from "@/lib/api";
import { SearchResultCard } from "@/components/SearchResultCard";
import { ButtonLink, Container, Icon, SectionHeading } from "@/components/ui";

/**
 * The city × subject landing page — `/tutors/hyderabad/mathematics`.
 *
 * <p>These are the primary acquisition channel for this business model
 * (SOURCE_OF_TRUTH ADR #3). A parent does not search "tutoring marketplace"; they
 * search "maths tutor in Gachibowli", and this is the page that answers.
 *
 * <p>Server-rendered, no client JavaScript. A crawler that sees an empty shell
 * indexes nothing, and the entire strategy depends on this page being complete
 * in its initial HTML.
 */

type Params = { params: Promise<{ slug: string; subject: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, subject } = await params;
  const [cities, subjects] = await Promise.all([
    fetchCities(),
    fetchLeafSubjects(),
  ]);

  const city = cities.find((c) => c.slug === slug);
  const subj = subjects.find((s) => s.slug === subject);
  if (!city || !subj) return { title: "Not found" };

  const results = await searchTutors({ location: city.slug, subject: subj.slug });

  return {
    // Written as a person would search, not as a database would label. The
    // title is most of what decides whether a result gets clicked.
    title: `${subj.name} tutors in ${city.name} — home & online`,
    description: `Find verified ${subj.name} tutors in ${city.name}. Home tuition and online classes. Post your requirement free and tutors near you get in touch.`,
    alternates: { canonical: `/tutors/${city.slug}/${subj.slug}` },
    // A page with no tutors is a thin page. Indexing thousands of them earns a
    // site-wide quality penalty, so an empty combination stays out of the index
    // until it has something to show (M2-08.4).
    robots:
      results.totalElements === 0
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

export default async function CitySubjectPage({ params }: Params) {
  const { slug, subject } = await params;

  const [cities, subjects] = await Promise.all([
    fetchCities(),
    fetchLeafSubjects(),
  ]);

  const city = cities.find((c) => c.slug === slug);
  const subj = subjects.find((s) => s.slug === subject);

  // A slug pair that is not a real city and subject is a 404, not an empty
  // search. Rendering a page for every arbitrary URL is how a site accumulates
  // thousands of junk pages.
  if (!city || !subj) notFound();

  const results = await searchTutors({
    location: city.slug,
    subject: subj.slug,
  });

  const relatedSubjects = subjects
    .filter((s) => s.category === subj.category && s.slug !== subj.slug)
    .slice(0, 6);
  const otherCities = cities.filter((c) => c.slug !== city.slug).slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: `${subj.name} tutoring`,
            areaServed: { "@type": "City", name: city.name },
            provider: { "@type": "Organization", name: "ApnaTutor" },
          }),
        }}
      />

      <Container className="pt-5 sm:pt-6">
        <section className="panel bg-brand-wash px-6 py-12 sm:px-10 sm:py-14">
          <nav className="text-sm text-ink-500" aria-label="Breadcrumb">
            <Link href="/tutors" className="hover:text-brand-700">
              Tutors
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/tutors/${city.slug}`} className="hover:text-brand-700">
              {city.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink-700">{subj.name}</span>
          </nav>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            {subj.name} tutors in {city.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">
            {results.totalElements > 0
              ? `${results.totalElements} verified ${subj.name} ${results.totalElements === 1 ? "tutor" : "tutors"} available in ${city.name}, for home tuition or online classes.`
              : `We are onboarding ${subj.name} tutors in ${city.name} now. Post your requirement and we will connect you as soon as one joins.`}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/post-requirement" size="lg">
              Post your requirement
              <Icon name="arrow" className="h-5 w-5" />
            </ButtonLink>
            <ButtonLink
              href={`/tutors?location=${city.slug}&subject=${subj.slug}`}
              variant="secondary"
              size="lg"
            >
              Refine your search
            </ButtonLink>
          </div>
        </section>
      </Container>

      {results.content.length > 0 && (
        <Container className="py-5 sm:py-6">
          <section className="panel bg-white px-6 py-10 ring-1 ring-ink-200/70 sm:px-10">
            <SectionHeading title={`Available ${subj.name} tutors`} />
            <div className="mt-8 space-y-4">
              {results.content.slice(0, 10).map((tutor) => (
                <SearchResultCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          </section>
        </Container>
      )}

      {/* Internal linking. Every one of these pages needs to be reachable from
          another, or it is never crawled — a sitemap alone is a weak signal. */}
      <Container className="py-5 sm:py-6">
        <section className="panel bg-white px-6 py-10 ring-1 ring-ink-200/70 sm:px-10">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold">
                Other subjects in {city.name}
              </h2>
              <ul className="mt-4 space-y-2">
                {relatedSubjects.map((related) => (
                  <li key={related.slug}>
                    <Link
                      href={`/tutors/${city.slug}/${related.slug}`}
                      className="text-ink-600 hover:text-brand-700"
                    >
                      {related.name} tutors in {city.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold">
                {subj.name} in other cities
              </h2>
              <ul className="mt-4 space-y-2">
                {otherCities.map((other) => (
                  <li key={other.slug}>
                    <Link
                      href={`/tutors/${other.slug}/${subj.slug}`}
                      className="text-ink-600 hover:text-brand-700"
                    >
                      {subj.name} tutors in {other.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
