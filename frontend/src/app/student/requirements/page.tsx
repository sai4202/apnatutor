"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { Badge, ButtonLink, Container, Icon } from "@/components/ui";
import { StarRating } from "@/components/StarRating";

/**
 * A parent's enquiries and the tutors who responded.
 *
 * <p>The responding tutors' phone numbers are shown in full here, and that is
 * correct rather than a leak: each of those tutors spent credits specifically to
 * start this conversation, and a parent who cannot call back has been sold
 * nothing.
 */

interface RespondingTutor {
  tutorProfileId: number | null;
  displayName: string | null;
  headline: string | null;
  phone: string | null;
  introMessage: string | null;
  respondedAt: string;
}

interface Requirement {
  id: number;
  subject: string | null;
  gradeLevel: string | null;
  board: string | null;
  location: string | null;
  mode: string;
  budgetAmountPaise: number | null;
  budgetUnit: string | null;
  description: string | null;
  status: "OPEN" | "CAPPED" | "HIRED" | "CLOSED" | "EXPIRED";
  responseCount: number;
  remainingSlots: number;
  expiresAt: string;
  postedAt: string;
  respondingTutors: RespondingTutor[];
}


/** A review this student has written, keyed to the tutor it is about. */
interface OwnReview {
  id: number;
  tutorProfileId: number | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
}

const MODE_LABELS: Record<string, string> = {
  STUDENT_HOME: "At your home",
  TUTOR_PLACE: "At tutor's place",
  ONLINE: "Online",
};

const STATUS_TONE: Record<
  Requirement["status"],
  "success" | "brand" | "neutral" | "warning"
> = {
  OPEN: "success",
  CAPPED: "brand",
  HIRED: "neutral",
  CLOSED: "neutral",
  EXPIRED: "neutral",
};

const STATUS_LABEL: Record<Requirement["status"], string> = {
  OPEN: "Open",
  CAPPED: "All responses received",
  HIRED: "Hired",
  CLOSED: "Closed",
  EXPIRED: "Expired",
};

function formatMoney(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function MyRequirementsPage() {
  const { authFetch } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [reviews, setReviews] = useState<OwnReview[]>([]);

  /**
   * Every review this student has written, fetched once.
   *
   * Not an eligibility call per responding tutor: anyone in that list has
   * already paid to reach this student, which is exactly the condition the
   * backend checks. So the only question left is whether a review already
   * exists, and one request answers it for the whole page.
   */
  const loadReviews = useCallback(async () => {
    try {
      const res = await authFetch("/student/reviews");
      if (res.ok) setReviews((await res.json()) as OwnReview[]);
    } catch {
      // Non-fatal: the enquiries are the point of this page, and a missing
      // review box is better than an error screen over one.
    }
  }, [authFetch]);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/student/requirements");
      if (res.ok) setRequirements(await res.json());
      else setError("Could not load your enquiries.");
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch]);

  useEffect(() => {
    // See the note in student/profile: awaiting inside the effect is what lets
    // React's set-state-in-effect rule see that the writes are post-await.
    async function run() {
      await load();
      await loadReviews();
    }
    void run();
  }, [load, loadReviews]);

  async function act(id: number, action: "hired" | "close") {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch(`/student/requirements/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.message ?? "Could not update that enquiry.");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!requirements) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
      </Container>
    );
  }

  return (
    <Container className="py-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">My enquiries</h1>
              <p className="mt-1 text-ink-600">
                Only a handful of tutors can respond to each, so your phone stays
                sane.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/student/profile"
                className="text-sm font-medium text-ink-600 hover:text-brand-700"
              >
                My details
              </Link>
              <ButtonLink href="/post-requirement">
                Post another
                <Icon name="arrow" className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>

        <ErrorBanner message={error} />

        {requirements.length === 0 ? (
          <section className="panel bg-white p-10 text-center ring-1 ring-ink-200/70 sm:p-14">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="search" className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-xl font-semibold">No enquiries yet</h2>
            <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-600">
              Tell us what you need and verified tutors near you will get in
              touch. It is free.
            </p>
            <ButtonLink href="/post-requirement" size="lg" className="mt-7">
              Post your first requirement
              <Icon name="arrow" className="h-5 w-5" />
            </ButtonLink>
          </section>
        ) : (
          requirements.map((requirement) => (
            <section
              key={requirement.id}
              className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold">{requirement.subject}</h2>
                    <Badge tone={STATUS_TONE[requirement.status]}>
                      {STATUS_LABEL[requirement.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {[
                      requirement.gradeLevel,
                      requirement.board,
                      requirement.location,
                      MODE_LABELS[requirement.mode],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                {requirement.budgetAmountPaise !== null && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-ink-900">
                      {formatMoney(requirement.budgetAmountPaise)}
                    </p>
                    <p className="text-sm text-ink-500">
                      {requirement.budgetUnit === "PER_MONTH"
                        ? "per month"
                        : "per hour"}
                    </p>
                  </div>
                )}
              </div>

              {requirement.description && (
                <p className="mt-4 leading-relaxed text-ink-600">
                  {requirement.description}
                </p>
              )}

              <div className="mt-5 rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200">
                <p className="text-sm font-semibold text-ink-900">
                  {requirement.responseCount === 0
                    ? "No responses yet"
                    : `${requirement.responseCount} tutor${requirement.responseCount === 1 ? "" : "s"} responded`}
                  {requirement.status === "OPEN" && (
                    <span className="ml-1.5 font-normal text-ink-500">
                      · {requirement.remainingSlots} slot
                      {requirement.remainingSlots === 1 ? "" : "s"} left
                    </span>
                  )}
                </p>

                {requirement.respondingTutors.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {requirement.respondingTutors.map((tutor) => (
                      <li
                        key={tutor.respondedAt + (tutor.phone ?? "")}
                        className="rounded-lg bg-white p-4 ring-1 ring-ink-200"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink-900">
                              {tutor.displayName ?? "Tutor"}
                            </p>
                            {tutor.headline && (
                              <p className="text-sm text-ink-600">
                                {tutor.headline}
                              </p>
                            )}
                          </div>
                          {tutor.phone && (
                            /* Shown in full. This tutor spent credits to start
                               this conversation; a parent who cannot call back
                               has been sold nothing. */
                            <a
                              href={`tel:${tutor.phone}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                            >
                              Call {tutor.phone}
                            </a>
                          )}
                        </div>
                        {tutor.introMessage && (
                          <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm leading-relaxed text-ink-700">
                            “{tutor.introMessage}”
                          </p>
                        )}
                        {tutor.tutorProfileId && (
                          <Link
                            href={`/tutors/${tutor.tutorProfileId}`}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                          >
                            See full profile
                            <Icon name="arrow" className="h-4 w-4" />
                          </Link>
                        )}

                        {tutor.tutorProfileId && (
                          <ReviewComposer
                            tutorProfileId={tutor.tutorProfileId}
                            tutorName={tutor.displayName ?? "this tutor"}
                            existing={reviews.find(
                              (review) =>
                                review.tutorProfileId === tutor.tutorProfileId,
                            )}
                            onSaved={loadReviews}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  requirement.status === "OPEN" && (
                    <p className="mt-2 text-sm text-ink-600">
                      Tutors matching your subject and area can see this now.
                      Most parents hear back within a few hours.
                    </p>
                  )
                )}
              </div>

              {(requirement.status === "OPEN" ||
                requirement.status === "CAPPED") && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-ink-100 pt-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(requirement.id, "hired")}
                    className="rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-50"
                  >
                    I hired a tutor
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(requirement.id, "close")}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50 disabled:opacity-50"
                  >
                    Withdraw this enquiry
                  </button>
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </Container>
  );
}

/**
 * Writing or revising a review of one tutor, inline on the enquiry it came from.
 *
 * <p>Placed here rather than on a separate "leave a review" screen because this
 * is where the student already is when they have an opinion — looking at the
 * tutor who answered them. A review flow that starts with finding the tutor
 * again collects far fewer reviews, and reviews are the scarce input.
 *
 * <p>Editing is offered only while the review is still pending. After approval
 * the text is public under a moderator's decision, and the backend refuses the
 * edit — so offering the box would be a lie.
 */
function ReviewComposer({
  tutorProfileId,
  tutorName,
  existing,
  onSaved,
}: {
  tutorProfileId: number;
  tutorName: string;
  existing: OwnReview | undefined;
  onSaved: () => Promise<void>;
}) {
  const { authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const editable = !existing || existing.status === "PENDING";

  async function submit() {
    if (rating < 1) return;
    setSaving(true);
    setFailure(null);

    try {
      const res = await authFetch(`/student/reviews/tutor/${tutorProfileId}`, {
        method: "POST",
        body: JSON.stringify({ rating, title, body }),
      });

      if (!res.ok) {
        const problem = await res.json().catch(() => null);
        setFailure(problem?.message ?? "Could not save your review.");
        return;
      }

      setOpen(false);
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-3 border-t border-ink-100 pt-3">
        {existing ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <StarRating rating={existing.rating} />
            <span className="text-sm text-ink-500">
              {existing.status === "APPROVED"
                ? "Your review is published"
                : existing.status === "PENDING"
                  ? "Your review is awaiting moderation"
                  : "Your review was not published"}
            </span>
            {editable && (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Edit
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Review {tutorName}
          </button>
        )}

        {existing?.status === "REJECTED" && existing.rejectionReason && (
          <p className="mt-2 text-sm text-ink-600">
            {existing.rejectionReason}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-ink-100 pt-4">
      <fieldset>
        <legend className="text-sm font-medium text-ink-700">
          How was {tutorName}?
        </legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} out of 5`}
              aria-pressed={rating === star}
              onClick={() => setRating(star)}
              className="rounded p-0.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <Icon
                name="star"
                className={`h-7 w-7 ${
                  star <= rating ? "text-amber-500" : "text-ink-200"
                }`}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={160}
        placeholder="Sum it up in a few words"
        className="mt-3 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="What went well, and what other parents should know."
        className="mt-2 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      <p className="mt-2 text-xs text-ink-500">
        Reviews are checked by a person before they appear, usually within a day.
      </p>
      {failure && <p className="mt-2 text-sm text-danger-700">{failure}</p>}

      <div className="mt-3 flex gap-2.5">
        <button
          type="button"
          onClick={submit}
          disabled={saving || rating < 1}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : existing ? "Update review" : "Submit review"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
