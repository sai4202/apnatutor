import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMPLE_TUTORS, findExampleTutor } from "@/lib/exampleTutors";
import {
  Badge,
  ButtonLink,
  Card,
  Container,
  Icon,
  SectionHeading,
} from "@/components/ui";

/**
 * A tutor's public profile.
 *
 * This is the real M2-06 page, built against example data. When the search and
 * profile endpoints land, the lookup below becomes a fetch and everything else
 * stays as it is.
 *
 * <h2>Contact details are absent by design</h2>
 *
 * There is no phone number anywhere on this page, and there will not be one when
 * the data is real. Contact details <em>are</em> the product — they are what
 * tutors pay credits to unlock — so a public profile that leaked one would
 * remove the business model, not merely degrade it (SOURCE_OF_TRUTH.md §1,
 * "Masked"). The only route to a tutor is posting a requirement.
 */

const MODE_LABELS: Record<string, string> = {
  STUDENT_HOME: "At your home",
  TUTOR_PLACE: "At tutor's place",
  ONLINE: "Online",
};

// Slugs are known ahead of time, so every profile is prerendered as static HTML
// at build time. With real data this becomes the set of published tutors.
export function generateStaticParams() {
  return EXAMPLE_TUTORS.map((tutor) => ({ slug: tutor.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tutor = findExampleTutor(slug);
  if (!tutor) return { title: "Tutor not found" };

  return {
    title: `${tutor.name} — ${tutor.headline}`,
    description: `${tutor.name} teaches ${tutor.subjects.join(", ")} in ${tutor.locality}, ${tutor.city}. ${tutor.experienceYears} years of experience.`,
  };
}

function formatFee(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutor = findExampleTutor(slug);

  // A slug that is not a city and not a tutor is genuinely a 404. Cities are
  // handled by the /tutors/[city] listing, which does not exist yet — worth
  // knowing this route will need to disambiguate the two in M2.
  if (!tutor) notFound();

  const initials = tutor.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <>
      {/* Stated plainly and at the top. A visitor should never have to work out
          whether a profile is real. */}
      <div className="border-b border-warning-600/20 bg-warning-50">
        <Container className="py-2.5">
          <p className="text-center text-sm text-ink-700">
            <span className="font-semibold">Example profile.</span> Real tutor
            listings open once verification is complete.
          </p>
        </Container>
      </div>

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
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-[var(--shadow-brand)]"
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-bold sm:text-4xl">{tutor.name}</h1>
                {tutor.verified && (
                  <Badge tone="success">
                    <Icon name="check" className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-lg text-ink-600">{tutor.headline}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600">
                <span className="flex items-center gap-1.5">
                  <Icon name="star" className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-ink-900">
                    {tutor.rating.toFixed(1)}
                  </span>
                  <span className="text-ink-500">
                    ({tutor.reviewCount} reviews)
                  </span>
                </span>
                <span>{tutor.experienceYears} years experience</span>
                <span className="flex items-center gap-1.5">
                  <Icon name="location" className="h-4 w-4 text-ink-400" />
                  {tutor.locality}, {tutor.city}
                </span>
              </div>
            </div>

            <div className="shrink-0 rounded-xl bg-white p-5 text-center ring-1 ring-ink-200 shadow-sm sm:w-52">
              <p className="text-sm text-ink-500">Starting from</p>
              <p className="mt-0.5 text-2xl font-bold text-ink-900">
                {formatFee(tutor.feeFromPaise)}
                <span className="text-base font-medium text-ink-500">
                  {tutor.feeUnit === "PER_MONTH" ? "/month" : "/hour"}
                </span>
              </p>
              <ButtonLink
                href="/post-requirement"
                size="md"
                className="mt-4 w-full"
              >
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
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold">About</h2>
              <p className="mt-3 leading-relaxed text-ink-600">{tutor.about}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold">Subjects taught</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {tutor.subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-lg bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-200"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold">Qualifications</h2>
              <ul className="mt-4 space-y-3">
                {tutor.qualifications.map((qualification) => (
                  <li
                    key={qualification.degree}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="font-medium text-ink-900">
                        {qualification.degree}
                      </p>
                      <p className="text-sm text-ink-500">
                        {qualification.institution} · {qualification.year}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-500">
                Documents checked by the ApnaTutor team.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold">Reviews</h2>
              {/* No invented reviews. Fabricated testimonials are the single
                  fastest way to lose a parent's trust, and they are trivially
                  spotted. Real reviews arrive in M5. */}
              <Card className="mt-4 p-8 text-center">
                <p className="text-ink-600">
                  Reviews from verified students appear here once a tutor has
                  taught through ApnaTutor.
                </p>
              </Card>
            </section>
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500">
                Class details
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-ink-500">Teaching modes</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {tutor.modes.map((mode) => (
                      <span
                        key={mode}
                        className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700"
                      >
                        {MODE_LABELS[mode]}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-500">Availability</dt>
                  <dd className="mt-1 text-ink-800">{tutor.availability}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Languages</dt>
                  <dd className="mt-1 text-ink-800">
                    {tutor.languages.join(", ")}
                  </dd>
                </div>
                {tutor.travelRadiusKm > 0 && (
                  <div>
                    <dt className="text-ink-500">Travels up to</dt>
                    <dd className="mt-1 text-ink-800">
                      {tutor.travelRadiusKm} km from {tutor.locality}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Explains the absence of a phone number rather than leaving the
                visitor hunting for one. */}
            <Card className="bg-brand-50 p-6 ring-brand-200">
              <h2 className="font-semibold text-brand-900">
                How to reach {tutor.name.split(" ")[0]}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-900/80">
                Post your requirement and tutors who match will contact you
                directly. We never publish a tutor&apos;s number, and we never
                publish yours.
              </p>
              <ButtonLink
                href="/post-requirement"
                size="sm"
                className="mt-4 w-full"
              >
                Post a requirement
              </ButtonLink>
            </Card>
          </aside>
        </div>

        <div className="mt-16">
          <SectionHeading title="Other tutors" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {EXAMPLE_TUTORS.filter((other) => other.slug !== tutor.slug).map(
              (other) => (
                <Link
                  key={other.slug}
                  href={`/tutors/${other.slug}`}
                  className="group block"
                >
                  <Card interactive className="p-5">
                    <p className="font-semibold text-ink-900">{other.name}</p>
                    <p className="mt-0.5 text-sm text-ink-600">
                      {other.headline}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-600">
                      {formatFee(other.feeFromPaise)}
                      <span className="font-medium text-ink-500">
                        {other.feeUnit === "PER_MONTH" ? "/month" : "/hour"}
                      </span>
                    </p>
                  </Card>
                </Link>
              ),
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
