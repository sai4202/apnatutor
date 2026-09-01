import Link from "next/link";
import { Icon } from "@/components/ui";

/**
 * A tutor search result.
 *
 * This is the real component, not hero decoration. It is previewed on the
 * landing page with example data and will render actual search results in M2,
 * so the shape below is the shape the search endpoint has to return.
 *
 * Built to be scannable in about two seconds, because that is how long a parent
 * spends on each result before moving on. Ordered by what they decide on:
 * who → what they teach → are they trustworthy → what it costs → can they reach me.
 */
export interface TutorSummary {
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
}

const MODE_LABELS: Record<TutorSummary["modes"][number], string> = {
  STUDENT_HOME: "At your home",
  TUTOR_PLACE: "At tutor's place",
  ONLINE: "Online",
};

/**
 * Rupees, formatted the Indian way — ₹3,000 not ₹3.000, and lakh/crore grouping
 * for larger numbers. Money is stored in paise as an integer (SoT §5), so this
 * is also the one place that conversion happens.
 */
function formatFee(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/** Initials as an avatar fallback. Most tutors will not have uploaded a photo on day one. */
function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function TutorCard({
  tutor,
  href,
  className = "",
}: {
  tutor: TutorSummary;
  /** When given, the whole card becomes one link rather than only the CTA text. */
  href?: string;
  className?: string;
}) {
  const card = (
    <article
      className={`rounded-xl bg-white p-5 ring-1 ring-ink-200 shadow-sm ${
        href ? "transition-all group-hover:shadow-md group-hover:ring-brand-300" : ""
      } ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700"
          aria-hidden="true"
        >
          {initials(tutor.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-ink-900">{tutor.name}</h3>
            {tutor.verified && (
              /* The verification badge is the single most load-bearing element
                 on this card. A parent is deciding whether to let this person
                 into their home. */
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"
                title="ID and qualifications verified"
              >
                <Icon name="check" className="h-2.5 w-2.5" />
                <span className="sr-only">Verified</span>
              </span>
            )}
          </div>
          <p className="truncate text-sm text-ink-600">{tutor.headline}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <Icon name="star" className="h-3.5 w-3.5 text-amber-500" />
              <span className="font-semibold text-ink-800">
                {tutor.rating.toFixed(1)}
              </span>
              <span>({tutor.reviewCount})</span>
            </span>
            <span>{tutor.experienceYears} yrs exp</span>
            <span className="flex items-center gap-1">
              <Icon name="location" className="h-3.5 w-3.5" />
              {tutor.locality}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {tutor.subjects.slice(0, 3).map((subject) => (
          <span
            key={subject}
            className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700"
          >
            {subject}
          </span>
        ))}
        {tutor.modes.slice(0, 1).map((mode) => (
          <span
            key={mode}
            className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
          >
            {MODE_LABELS[mode]}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-ink-100 pt-3.5">
        <div>
          <span className="text-lg font-bold text-ink-900">
            {formatFee(tutor.feeFromPaise)}
          </span>
          <span className="text-sm text-ink-500">
            {tutor.feeUnit === "PER_MONTH" ? "/month" : "/hour"}
          </span>
        </div>
        <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
          View profile
          <Icon name="arrow" className="h-4 w-4" />
        </span>
      </div>
    </article>
  );

  // The whole card is the target, not just the "View profile" text. A 200px-tall
  // card with a 90px link inside it is a small target on a phone, and people tap
  // the card anyway.
  return href ? (
    <Link href={href} className="group block">
      {card}
    </Link>
  ) : (
    card
  );
}
