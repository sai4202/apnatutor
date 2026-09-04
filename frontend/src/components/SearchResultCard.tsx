import Link from "next/link";
import type { TutorSearchResult } from "@/lib/api";
import { Icon } from "@/components/ui";

/**
 * A tutor in a search results list.
 *
 * <p>Distinct from `TutorCard`, which is the compact hero preview. This one is
 * wider, shows more subjects, and gives the verification badge real prominence —
 * on a results page a parent is comparing strangers, and the badge is the single
 * strongest signal they have.
 *
 * <p>Reads the same shape the search endpoint returns, which has no contact
 * fields on it at all. There is nothing here to leak.
 */

const MODE_LABELS: Record<string, string> = {
  STUDENT_HOME: "At your home",
  TUTOR_PLACE: "At tutor's place",
  ONLINE: "Online",
};

function formatFee(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function SearchResultCard({ tutor }: { tutor: TutorSearchResult }) {
  const name = tutor.displayName ?? "Tutor";

  return (
    <Link href={`/tutors/${tutor.id}`} className="group block">
      <article className="rounded-2xl bg-white p-5 ring-1 ring-ink-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300 sm:p-6">
        <div className="flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-base font-bold text-brand-700 sm:h-16 sm:w-16"
            aria-hidden="true"
          >
            {initials(name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-ink-900 group-hover:text-brand-700">
                {name}
              </h3>
              {tutor.idVerified && (
                /* Given real prominence: on a results page a parent is comparing
                   strangers, and this is the strongest signal they have. */
                <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700 ring-1 ring-inset ring-success-600/20">
                  <Icon name="check" className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            {tutor.headline && (
              <p className="mt-0.5 text-ink-600">{tutor.headline}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              {tutor.avgRating != null ? (
                <span className="flex items-center gap-1">
                  <Icon name="star" className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold text-ink-800">
                    {tutor.avgRating.toFixed(1)}
                  </span>
                  <span>({tutor.reviewCount})</span>
                </span>
              ) : (
                /* Not a zero rating. "0.0 (0)" reads as bad rather than new, and
                   punishing a tutor for having just joined is how supply never
                   arrives. */
                <span className="text-ink-400">New tutor</span>
              )}
              <span>{tutor.experienceYears} yrs experience</span>
              {tutor.locality && (
                <span className="flex items-center gap-1">
                  <Icon name="location" className="h-4 w-4" />
                  {tutor.locality}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {tutor.subjects.slice(0, 4).map((subject) => (
                <span
                  key={subject}
                  className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700"
                >
                  {subject}
                </span>
              ))}
              {tutor.teachingModes.slice(0, 2).map((mode) => (
                <span
                  key={mode}
                  className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                >
                  {MODE_LABELS[mode] ?? mode}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden shrink-0 text-right sm:block">
            {tutor.feeMinPaise != null && (
              <>
                <p className="text-xl font-bold text-ink-900">
                  {formatFee(tutor.feeMinPaise)}
                </p>
                <p className="text-sm text-ink-500">
                  {tutor.feeUnit === "PER_MONTH" ? "per month" : "per hour"}
                </p>
                {tutor.feeNegotiable && (
                  <p className="mt-1 text-xs text-success-700">Negotiable</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* The fee repeats on narrow screens, where the column above is hidden. */}
        {tutor.feeMinPaise != null && (
          <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 sm:hidden">
            <span className="font-bold text-ink-900">
              {formatFee(tutor.feeMinPaise)}
              <span className="text-sm font-medium text-ink-500">
                {tutor.feeUnit === "PER_MONTH" ? "/month" : "/hour"}
              </span>
            </span>
            <span className="text-sm font-semibold text-brand-600">
              View profile
            </span>
          </div>
        )}
      </article>
    </Link>
  );
}
