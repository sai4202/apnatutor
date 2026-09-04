import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchCities,
  fetchLeafSubjects,
  fetchTutorProfile,
  fetchTutorReviews,
  searchTutors,
  type PublicTutorProfile,
} from "@/lib/api";
import { EXAMPLE_TUTORS, findExampleTutor } from "@/lib/exampleTutors";
import { SearchResultCard } from "@/components/SearchResultCard";
import { SubjectTile } from "@/components/SubjectTile";
import { ReportButton } from "@/components/ReportButton";
import { TutorReviews } from "@/components/TutorReviews";
import {
  Badge,
  ButtonLink,
  Card,
  Container,
  Icon,
  SectionHeading,
} from "@/components/ui";

/**
 * One route, three meanings.
 *
 * <p>`/tutors/123` is a tutor profile, `/tutors/hyderabad` is a city landing page,
 * and `/tutors/ananya-reddy` is one of the example profiles. Next matches all
 * three with the same `[slug]` segment, so this resolves which is which.
 *
 * <p>Order matters: numeric first (a real profile), then city, then example. A
 * city slug and an example slug can never collide — cities come from the catalog
 * and examples are hardcoded — but checking numeric first means a real tutor
 * always wins if one ever were named like a city.
 *
 * <p>The alternative, prefixing routes as `/tutors/city/...` and
 * `/tutors/profile/...`, would be simpler code and worse URLs. `/tutors/hyderabad`
 * is what a person would type and what reads well in a search result, and this
 * page's whole purpose is being found.
 */

type Params = { params: Promise<{ slug: string }> };

async function resolve(slug: string) {
  if (/^\d+$/.test(slug)) {
    const profile = await fetchTutorProfile(Number(slug));
    if (profile) return { kind: "tutor" as const, profile };
  }

  const cities = await fetchCities();
  const city = cities.find((c) => c.slug === slug);
  if (city) return { kind: "city" as const, city };

  const example = findExampleTutor(slug);
  if (example) return { kind: "example" as const, example };

  return { kind: "unknown" as const };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolve(slug);

  if (resolved.kind === "tutor") {
    const t = resolved.profile;
    return {
      title: `${t.displayName} — ${t.headline ?? "Tutor"}`,
      description: `${t.displayName} teaches ${t.subjects.map((s) => s.name).join(", ")}. ${t.experienceYears} years of experience.`,
      alternates: { canonical: `/tutors/${t.id}` },
    };
  }

  if (resolved.kind === "city") {
    return {
      title: `Home and online tutors in ${resolved.city.name}`,
      description: `Find verified home and online tutors in ${resolved.city.name}, ${resolved.city.state}. Post your requirement free and tutors near you get in touch.`,
      alternates: { canonical: `/tutors/${resolved.city.slug}` },
    };
  }

  if (resolved.kind === "example") {
    return {
      title: `${resolved.example.name} — ${resolved.example.headline}`,
      // Example data must never be indexed: it would put fabricated tutors into
      // Google under our domain.
      robots: { index: false, follow: false },
    };
  }

  return { title: "Not found" };
}

export default async function TutorSlugPage({ params }: Params) {
  const { slug } = await params;
  const resolved = await resolve(slug);

  if (resolved.kind === "city") return <CityLanding city={resolved.city} />;
  if (resolved.kind === "tutor") return <TutorProfile tutor={resolved.profile} />;
  if (resolved.kind === "example") return <ExampleProfile slug={slug} />;

  notFound();
}

/* -------------------------------------------------------------------------- */
/* City landing — M2-07                                                        */
/* -------------------------------------------------------------------------- */

async function CityLanding({
  city,
}: {
  city: { name: string; state: string; slug: string };
}) {
  const [results, subjects] = await Promise.all([
    searchTutors({ location: city.slug }),
    fetchLeafSubjects(),
  ]);

  // Internal linking to the city×subject pages. This is how those pages get
  // discovered — a page nothing links to is a page nothing indexes.
  const popular = subjects.slice(0, 10);

  return (
    <>
      <Container className="pt-5 sm:pt-6">
        <section className="panel bg-brand-wash px-6 py-12 sm:px-10 sm:py-14">
          <nav className="text-sm text-ink-500" aria-label="Breadcrumb">
            <Link href="/tutors" className="hover:text-brand-700">
              Tutors
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink-700">{city.name}</span>
          </nav>

          <h1 className="mt-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Home &amp; online tutors in {city.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">
            Find verified tutors across {city.name}, {city.state}. Post what you
            need for free — at most five tutors will contact you, so your phone
            stays sane.
          </p>
          <ButtonLink href="/post-requirement" size="lg" className="mt-7">
            Post your requirement
            <Icon name="arrow" className="h-5 w-5" />
          </ButtonLink>
        </section>
      </Container>

      <Container className="py-5 sm:py-6">
        <section className="panel bg-white px-6 py-10 ring-1 ring-ink-200/70 sm:px-10">
          <SectionHeading
            title={`Popular subjects in ${city.name}`}
            description="Tap a subject to see tutors who teach it."
          />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {popular.map((subject, index) => (
              <SubjectTile
                key={subject.slug}
                name={subject.name}
                slug={subject.slug}
                categorySlug="school-tuition"
                index={index}
              />
            ))}
          </div>
        </section>
      </Container>

      {results.content.length > 0 && (
        <Container className="py-5 sm:py-6">
          <section className="panel bg-white px-6 py-10 ring-1 ring-ink-200/70 sm:px-10">
            <SectionHeading title={`Tutors in ${city.name}`} />
            <div className="mt-8 space-y-4">
              {results.content.slice(0, 5).map((tutor) => (
                <SearchResultCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
            <ButtonLink
              href={`/tutors?location=${city.slug}`}
              variant="secondary"
              className="mt-6"
            >
              See all {results.totalElements} tutors
              <Icon name="arrow" className="h-4 w-4" />
            </ButtonLink>
          </section>
        </Container>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Real tutor profile                                                          */
/* -------------------------------------------------------------------------- */

function formatFee(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

const MODE_LABELS: Record<string, string> = {
  STUDENT_HOME: "At your home",
  TUTOR_PLACE: "At tutor's place",
  ONLINE: "Online",
};

async function TutorProfile({ tutor }: { tutor: PublicTutorProfile }) {
  const name = tutor.displayName ?? "Tutor";
  const reviews = await fetchTutorReviews(tutor.id);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  return (
    <>
      {/* Structured data, so a result in Google can carry the rating and fee
          rather than a bare blue link. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name,
            jobTitle: "Tutor",
            description: tutor.headline,
            knowsAbout: tutor.subjects.map((s) => s.name),
            ...(tutor.avgRating !== null && tutor.reviewCount > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: tutor.avgRating,
                    reviewCount: tutor.reviewCount,
                  },
                }
              : {}),
          }),
        }}
      />

      <Container className="pt-5 sm:pt-6">
        <section className="panel bg-brand-wash px-6 py-10 sm:px-10 sm:py-12">
          <Link
            href="/tutors"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700"
          >
            <Icon name="arrow" className="h-4 w-4 rotate-180" />
            Back to search
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white"
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-bold sm:text-4xl">{name}</h1>
                {tutor.verifiedBadges.map((badge) => (
                  <Badge key={badge} tone="success">
                    <Icon name="check" className="h-3.5 w-3.5" />
                    {badge}
                  </Badge>
                ))}
              </div>
              {tutor.headline && (
                <p className="mt-1.5 text-lg text-ink-600">{tutor.headline}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600">
                {tutor.avgRating !== null ? (
                  <span className="flex items-center gap-1.5">
                    <Icon name="star" className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-ink-900">
                      {tutor.avgRating.toFixed(1)}
                    </span>
                    <span className="text-ink-500">
                      ({tutor.reviewCount} reviews)
                    </span>
                  </span>
                ) : (
                  <span className="text-ink-400">New tutor</span>
                )}
                <span>{tutor.experienceYears} years experience</span>
                {tutor.locations[0] && (
                  <span className="flex items-center gap-1.5">
                    <Icon name="location" className="h-4 w-4 text-ink-400" />
                    {tutor.locations[0].displayName}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 rounded-xl bg-white p-5 text-center ring-1 ring-ink-200 sm:w-52">
              {tutor.feeMinPaise !== null && (
                <>
                  <p className="text-sm text-ink-500">Starting from</p>
                  <p className="mt-0.5 text-2xl font-bold text-ink-900">
                    {formatFee(tutor.feeMinPaise)}
                    <span className="text-base font-medium text-ink-500">
                      {tutor.feeUnit === "PER_MONTH" ? "/month" : "/hour"}
                    </span>
                  </p>
                </>
              )}
              <ButtonLink href="/post-requirement" className="mt-4 w-full">
                Request a class
              </ButtonLink>
              {tutor.offersDemo && (
                <p className="mt-2.5 text-xs text-success-700">
                  Offers a free demo class
                </p>
              )}
            </div>
          </div>
        </section>
      </Container>

      <Container className="py-5 sm:py-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <div className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
            {tutor.bio && (
              <section>
                <h2 className="text-xl font-bold">About</h2>
                <p className="mt-3 leading-relaxed text-ink-600">{tutor.bio}</p>
              </section>
            )}

            <section className="mt-8">
              <h2 className="text-xl font-bold">Subjects taught</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {tutor.subjects.map((subject) => (
                  <span
                    key={subject.subjectId}
                    className="rounded-lg bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-200"
                  >
                    {subject.name}
                  </span>
                ))}
              </div>
            </section>

            {tutor.qualifications.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-bold">Qualifications</h2>
                <ul className="mt-4 space-y-3">
                  {tutor.qualifications.map((q) => (
                    <li key={q.id} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          q.verified
                            ? "bg-success-50 text-success-600"
                            : "bg-ink-100 text-ink-400"
                        }`}
                      >
                        <Icon name="check" className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-medium text-ink-900">{q.degree}</p>
                        <p className="text-sm text-ink-500">
                          {q.institution}
                          {q.year ? ` · ${q.year}` : ""}
                          {q.verified ? " · Verified" : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <TutorReviews reviews={reviews} tutorName={name} />

            {/* Quiet by design, and last on the page. Most visitors have nothing to report, and a
                prominent report control under every profile implies something is usually wrong. */}
            <div className="pt-2">
              <ReportButton subjectType="TUTOR" subjectId={tutor.id} />
            </div>
          </div>

          <aside className="space-y-5">
            <Card className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
                Class details
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-ink-500">Teaching modes</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {tutor.teachingModes.map((mode) => (
                      <span
                        key={mode}
                        className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700"
                      >
                        {MODE_LABELS[mode] ?? mode}
                      </span>
                    ))}
                  </dd>
                </div>
                {tutor.availabilityNote && (
                  <div>
                    <dt className="text-ink-500">Availability</dt>
                    <dd className="mt-1 text-ink-800">{tutor.availabilityNote}</dd>
                  </div>
                )}
                {tutor.languages.length > 0 && (
                  <div>
                    <dt className="text-ink-500">Languages</dt>
                    <dd className="mt-1 text-ink-800">
                      {tutor.languages.join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Explains the absent phone number rather than leaving a visitor
                hunting for one. Contact details are what tutors pay to unlock. */}
            <Card className="bg-brand-50 p-6 ring-brand-200">
              <h2 className="font-semibold text-brand-900">
                How to reach {name.split(" ")[0]}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-900/80">
                Post your requirement and matching tutors contact you directly. We
                never publish a tutor&apos;s number, and we never publish yours.
              </p>
              <ButtonLink href="/post-requirement" size="sm" className="mt-4 w-full">
                Post a requirement
              </ButtonLink>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Example profile — noindex, clearly labelled                                 */
/* -------------------------------------------------------------------------- */

function ExampleProfile({ slug }: { slug: string }) {
  const tutor = findExampleTutor(slug);
  if (!tutor) notFound();

  return (
    <>
      <div className="border-b border-warning-600/20 bg-warning-50">
        <Container className="py-2.5">
          <p className="text-center text-sm text-ink-700">
            <span className="font-semibold">Example profile.</span> Real tutor
            listings open once verification is complete.
          </p>
        </Container>
      </div>

      <Container className="py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold">{tutor.name}</h1>
          <p className="mt-2 text-lg text-ink-600">{tutor.headline}</p>
          <p className="mt-6 leading-relaxed text-ink-600">{tutor.about}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/tutors" size="lg">
              Browse real tutors
              <Icon name="arrow" className="h-5 w-5" />
            </ButtonLink>
            <ButtonLink href="/post-requirement" variant="secondary" size="lg">
              Post a requirement
            </ButtonLink>
          </div>
        </div>

        {EXAMPLE_TUTORS.length > 1 && (
          <p className="mt-10 text-center text-sm text-ink-400">
            This page exists so the profile layout can be reviewed before real
            listings arrive.
          </p>
        )}
      </Container>
    </>
  );
}
