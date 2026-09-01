import Link from "next/link";
import { fetchCities, fetchSubjectTree } from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { TutorCard } from "@/components/TutorCard";
import { CategoryIcon, categoryTile } from "@/components/CategoryIcon";
import { CityIcon } from "@/components/CityIcon";
import { EXAMPLE_TUTORS } from "@/lib/exampleTutors";
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
 * A Server Component with no client JavaScript: every element is static markup,
 * a plain form, or a CSS animation. Not minimalism for its own sake — this page
 * has to render completely for a crawler and load fast on a mid-range Android
 * phone on a patchy connection, which is the typical Indian visitor.
 *
 * <h2>Layout</h2>
 *
 * Each section is a rounded panel on a faint neutral ground rather than a
 * full-bleed band. Panels give every section a real edge, and because they all
 * sit inside the same Container their left and right edges line up down the
 * entire page — which is most of what separates a layout that looks designed
 * from one that looks assembled.
 *
 * Backgrounds alternate white → tinted → dark so no two adjacent sections read
 * as the same surface, and the dark panel lands where the page most needs a
 * change of pace.
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
  const totalSubjects = subjectTree.reduce(
    (sum, category) => sum + category.children.length,
    0,
  );

  return (
    <div className="space-y-5 py-5 sm:space-y-6 sm:py-6">
      {/* ---------------------------------------------------------------- */}
      {/* Hero — asymmetric: the pitch on the left, the product on the right */}
      {/* ---------------------------------------------------------------- */}
      <Container>
        <section className="panel relative bg-brand-wash">
          <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />

          <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-14">
              {/* Left-aligned, not centred. Centred text drags the eye back to
                  the middle on every line; a hard left edge gives the headline,
                  paragraph and search box one shared axis to scan down. */}
              <div className="animate-fade-up">
                <Badge tone="brand">
                  <Icon name="location" className="h-3.5 w-3.5" />
                  Home &amp; online tuition across India
                </Badge>

                <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-[3.5rem]">
                  Find the right tutor,{" "}
                  <span className="text-brand-600">right near you</span>
                </h1>

                <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">
                  Apna tutor, apne ghar ke paas. Post what you need for free, and
                  verified tutors in your area will reach out to you.
                </p>

                <div className="mt-8">
                  <SearchBar cities={cities} />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
                  {["Free for students", "Verified tutors", "Max 5 responses"].map(
                    (point) => (
                      <span key={point} className="flex items-center gap-1.5">
                        <Icon name="check" className="h-4 w-4 text-brand-600" />
                        {point}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {/* The product itself, looping. Fixed height: the card column
                  would otherwise be far taller than the left column, and
                  items-center would centre the short one — which is exactly what
                  left a large gap above the headline before. */}
              <div className="marquee-host relative hidden lg:block">
                <div className="marquee-mask h-[32rem] overflow-hidden">
                  <div className="animate-marquee-y space-y-3">
                    {[...EXAMPLE_TUTORS, ...EXAMPLE_TUTORS].map((tutor, index) => (
                      <TutorCard
                        key={`${tutor.slug}-${index}`}
                        tutor={tutor}
                        href={`/tutors/${tutor.slug}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-ink-400">
                  Example profiles — hover to pause
                </p>
              </div>
            </div>
          </div>
        </section>
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/* Stats — a slim panel, breaking the rhythm between two tall ones    */}
      {/* ---------------------------------------------------------------- */}
      <Container>
        <section className="panel bg-white ring-1 ring-ink-200/70">
          <dl className="grid divide-y divide-ink-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { value: `${totalSubjects}+`, label: "Subjects to learn" },
              { value: `${cities.length}`, label: "Cities across India" },
              { value: "5", label: "Tutors max per enquiry" },
            ].map((stat) => (
              <div key={stat.label} className="px-6 py-7 text-center">
                <dd className="text-3xl font-bold text-brand-600">{stat.value}</dd>
                <dt className="mt-1 text-sm text-ink-500">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/* How it works                                                      */}
      {/* ---------------------------------------------------------------- */}
      <Container>
        <section className="panel bg-white px-6 py-14 ring-1 ring-ink-200/70 sm:px-10 sm:py-16 lg:px-14">
          <SectionHeading
            centered
            eyebrow="How it works"
            title="Three steps, no chasing"
            description="Most parents hear from a tutor within a few hours of posting."
          />

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl bg-ink-50 p-7 ring-1 ring-ink-200/60"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-ink-400">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/* Subject categories                                                */}
      {/* ---------------------------------------------------------------- */}
      <Container>
        <section className="panel bg-section-tint px-6 py-14 ring-1 ring-brand-100 sm:px-10 sm:py-16 lg:px-14">
          <SectionHeading
            eyebrow="Browse"
            title="What would you like to learn?"
            description="From school tuition and entrance exams to music, languages and code."
          />

          {categories.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.slug} interactive className="p-6">
                  <div className="flex items-center gap-3">
                    {/* Colour-coded tile. The hue is per category and appears
                        only here — never on a button — so blue stays the single
                        action colour while categories stay distinguishable. */}
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${categoryTile(category.slug)}`}
                    >
                      <CategoryIcon slug={category.slug} className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-semibold text-ink-900">
                      {category.name}
                    </h3>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {category.children.slice(0, 6).map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/tutors?q=${child.slug}`}
                          className="inline-block rounded-lg bg-ink-50 px-3 py-1.5 text-sm text-ink-700 ring-1 ring-ink-200 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
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
               converts — the search bar and CTAs do not depend on this. */
            <p className="mt-10 rounded-xl bg-white p-6 text-ink-500 ring-1 ring-ink-200">
              Subject categories are loading. Try the search above in the meantime.
            </p>
          )}
        </section>
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/* Trust — the dark panel, where the page needs a change of pace      */}
      {/* ---------------------------------------------------------------- */}
      <Container>
        <section className="panel bg-ink-900 px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-400">
              Why parents trust us
            </p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              You are letting someone into your home
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-300">
              So we take verification, and your privacy, seriously.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TRUST.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white/5 p-7 ring-1 ring-white/10"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Icon name={item.icon} className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 leading-relaxed text-ink-300">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Container>

      {/* ---------------------------------------------------------------- */}
      {/* Cities — also internal linking for the M2 SEO pages                */}
      {/* ---------------------------------------------------------------- */}
      {cities.length > 0 && (
        <Container>
          <section className="panel bg-white px-6 py-14 ring-1 ring-ink-200/70 sm:px-10 sm:py-16 lg:px-14">
            <SectionHeading
              eyebrow="Cities"
              title="Tutors near you"
              description="Home tuition across India, and online everywhere."
            />

            {/* Landmark glyphs rather than ten identical pins. A Charminar next
                to a Gateway of India is recognised before the label is read. */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/tutors/${city.slug}`}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl bg-ink-50 px-3 py-5 text-center ring-1 ring-ink-200/60 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:ring-brand-300"
                >
                  <span className="text-ink-400 transition-colors group-hover:text-brand-600">
                    <CityIcon slug={city.slug} className="h-8 w-8" />
                  </span>
                  <span className="text-sm font-semibold text-ink-800 group-hover:text-brand-700">
                    {city.name}
                  </span>
                  <span className="text-xs text-ink-400">{city.state}</span>
                </Link>
              ))}
            </div>
          </section>
        </Container>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Split CTA — the two audiences, side by side                       */}
      {/* ---------------------------------------------------------------- */}
      <Container>
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          <section className="panel bg-brand-600 px-8 py-10 sm:px-11 sm:py-12">
            {/* text-white on the heading now actually applies — the base
                heading colour used to be unlayered and silently won. */}
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
          </section>

          <section className="panel bg-ink-900 px-8 py-10 sm:px-11 sm:py-12">
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
          </section>
        </div>
      </Container>
    </div>
  );
}
