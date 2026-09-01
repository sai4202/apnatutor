import type { Metadata } from "next";
import { fetchCities, fetchSubjectTree } from "@/lib/api";
import {
  Badge,
  ButtonLink,
  Card,
  Container,
  Icon,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Post your requirement",
  description:
    "Tell us what you need and verified tutors near you will get in touch. Free for students and parents.",
};

export const revalidate = 3600;

/**
 * Post-a-requirement form.
 *
 * The layout and field set are real — this is the top-of-funnel conversion point
 * and worth designing properly — but submission is disabled until M3-03, which
 * builds the endpoint behind it.
 *
 * Fields are deliberately disabled rather than hidden: a form that looks
 * complete and silently discards what you type is worse than one that plainly
 * says it is not ready yet.
 */
export default async function PostRequirementPage() {
  const [subjectTree, cities] = await Promise.all([
    fetchSubjectTree(),
    fetchCities(),
  ]);

  const leafSubjects = subjectTree.flatMap((category) =>
    category.children.map((child) => ({
      ...child,
      category: category.name,
    })),
  );

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Badge tone="success">
            <Icon name="check" className="h-3.5 w-3.5" />
            Free — always
          </Badge>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            Tell us what you need
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-600">
            Takes under a minute. Verified tutors near you will reach out — and
            at most five of them, so your phone stays sane.
          </p>
        </div>

        <Card className="mt-10 p-7 sm:p-9">
          <form className="space-y-6">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-ink-800">
                What do you need help with?
              </label>
              <select
                id="subject"
                disabled
                className="mt-1.5 h-12 w-full rounded-lg bg-white px-3 text-base ring-1 ring-ink-300 disabled:bg-ink-50 disabled:text-ink-400"
              >
                <option>Choose a subject…</option>
                {leafSubjects.map((subject) => (
                  <option key={subject.slug}>
                    {subject.category} — {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-ink-800">
                  Class / level
                </label>
                <select
                  id="grade"
                  disabled
                  className="mt-1.5 h-12 w-full rounded-lg bg-white px-3 text-base ring-1 ring-ink-300 disabled:bg-ink-50 disabled:text-ink-400"
                >
                  <option>Choose…</option>
                </select>
              </div>
              <div>
                <label htmlFor="board" className="block text-sm font-medium text-ink-800">
                  Board
                </label>
                <select
                  id="board"
                  disabled
                  className="mt-1.5 h-12 w-full rounded-lg bg-white px-3 text-base ring-1 ring-ink-300 disabled:bg-ink-50 disabled:text-ink-400"
                >
                  <option>Choose…</option>
                </select>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-ink-800">
                Where should classes happen?
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {["At my home", "At tutor's place", "Online"].map((mode) => (
                  <label
                    key={mode}
                    className="cursor-not-allowed rounded-lg px-4 py-3 text-center text-sm font-medium text-ink-400 ring-1 ring-ink-200"
                  >
                    {mode}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-ink-800">
                  City
                </label>
                <select
                  id="city"
                  disabled
                  className="mt-1.5 h-12 w-full rounded-lg bg-white px-3 text-base ring-1 ring-ink-300 disabled:bg-ink-50 disabled:text-ink-400"
                >
                  <option>Choose…</option>
                  {cities.map((city) => (
                    <option key={city.slug}>{city.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-ink-800">
                  Budget per month
                </label>
                <input
                  id="budget"
                  type="text"
                  disabled
                  placeholder="₹ 3,000"
                  className="mt-1.5 h-12 w-full rounded-lg bg-white px-3 text-base ring-1 ring-ink-300 disabled:bg-ink-50 disabled:placeholder:text-ink-300"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-ink-800">
                Anything else?
              </label>
              <textarea
                id="notes"
                rows={3}
                disabled
                placeholder="Preferred timings, how often, what your child is struggling with…"
                className="mt-1.5 w-full rounded-lg bg-white p-3 text-base ring-1 ring-ink-300 disabled:bg-ink-50 disabled:placeholder:text-ink-300"
              />
            </div>

            <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-200">
              <p className="text-sm leading-relaxed text-brand-900">
                <strong className="font-semibold">Not live yet.</strong> This form
                becomes functional in M3, when requirements and the tutor lead
                feed are built. Sign-in already works if you want to try the real
                flow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/login" size="lg" className="flex-1">
                Try signing in instead
                <Icon name="arrow" className="h-5 w-5" />
              </ButtonLink>
            </div>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-ink-500">
          Your phone number is never shown publicly. Only tutors who respond to
          your requirement can see it.
        </p>
      </div>
    </Container>
  );
}
