import type { Metadata } from "next";
import {
  ButtonLink,
  Card,
  Container,
  Icon,
  SectionHeading,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "For tutors",
  description:
    "Get student enquiries from your own area. Create a profile free and pay only for the leads you choose to respond to.",
};

/**
 * Tutor-side landing page.
 *
 * The supply side of a marketplace is the harder sell, so this page leads with
 * the two things tutors actually ask about: what it costs, and whether the leads
 * are real. Being explicit that a requirement is capped at five tutors is the
 * strongest argument available — it is what makes a lead worth paying for.
 */

const STEPS = [
  {
    icon: "users" as const,
    title: "Create your profile",
    body: "Subjects, fees, the areas you travel to, and your qualifications. Free, and it stays free.",
  },
  {
    icon: "shield" as const,
    title: "Get verified",
    body: "We check your ID and qualifications. Verified tutors get noticeably more responses — and 10 free credits.",
  },
  {
    icon: "search" as const,
    title: "Browse student requirements",
    body: "See enquiries matching your subjects and your area, with the budget and timing shown up front.",
  },
  {
    icon: "wallet" as const,
    title: "Unlock only what suits you",
    body: "Spend credits to see contact details for the enquiries you actually want. No subscription, no commission.",
  },
];

const FAIRNESS = [
  {
    title: "Only 5 tutors per enquiry",
    body: "We cap responses so you are not the twentieth person to call. A lead you unlock is a lead worth having.",
  },
  {
    title: "Credits back on bad leads",
    body: "Wrong number, wrong subject, or a student who never posted it? Raise it within 7 days and we refund the credits.",
  },
  {
    title: "You keep 100% of your fees",
    body: "Students pay you directly. ApnaTutor takes no commission on tuition — ever.",
  },
  {
    title: "You see the budget first",
    body: "Every enquiry shows the budget band and timing before you spend anything, so you never unlock blind.",
  },
];

export default function ForTutorsPage() {
  return (
    <>
      <Container className="pt-5 sm:pt-6">
        <section className="panel bg-brand-wash px-6 py-14 sm:px-10 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Students in your area are{" "}
              <span className="text-brand-600">looking for you</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              Create a profile for free. Browse real enquiries from parents near
              you, and pay only for the ones you choose to respond to.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/login" size="lg">
                Create your free profile
                <Icon name="arrow" className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="#how" variant="secondary" size="lg">
                See how it works
              </ButtonLink>
            </div>
          </div>
        </section>
      </Container>

      <Container className="pt-5 sm:pt-6">
        <section
          id="how"
          className="panel bg-white px-6 py-14 ring-1 ring-ink-200/70 sm:px-10 sm:py-16"
        >
          <SectionHeading
            eyebrow="How it works"
            title="Free to join. Pay only for leads you want."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <Card key={step.title} className="p-7">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon name={step.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-400">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-600">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </Container>

      <Container className="pt-5 sm:pt-6">
        <section className="panel bg-section-tint px-6 py-14 ring-1 ring-brand-100 sm:px-10 sm:py-16">
          <SectionHeading
            eyebrow="Fair by design"
            title="We would rather send you five good leads than fifty bad ones"
            description="The rules below exist because a marketplace that wastes tutors' money does not keep its tutors."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FAIRNESS.map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink-900">{item.title}</h3>
                  <p className="mt-1 leading-relaxed text-ink-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>

      <Container className="py-5 sm:py-6">
        <div className="panel bg-brand-600 p-10 text-center sm:p-14">
            <h2 className="text-3xl font-bold text-white">
              Start teaching with ApnaTutor
            </h2>
            <p className="mx-auto mt-3 max-w-lg leading-relaxed text-brand-100">
              Creating a profile takes about five minutes, and gets you 10 free
              credits once you are verified.
            </p>
            <ButtonLink
              href="/login"
              variant="secondary"
              size="lg"
              className="mt-8"
            >
              Create your free profile
              <Icon name="arrow" className="h-5 w-5" />
            </ButtonLink>
        </div>
      </Container>
    </>
  );
}
