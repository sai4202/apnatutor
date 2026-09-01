"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { StarRating } from "@/components/StarRating";
import { Badge, Button, Container } from "@/components/ui";

/**
 * What students have written about this tutor, and the one reply they get.
 *
 * <h2>Pending reviews are shown, not hidden</h2>
 *
 * <p>A review awaiting moderation is still about this tutor and will appear on
 * their profile the moment it is approved. Hiding it until then would mean the
 * first they learn of a complaint is a parent quoting it back at them.
 *
 * <p>Reviewer names are deliberately absent. A tutor who can put a name to a
 * poor rating has a specific family to take it up with, and the student wrote it
 * expecting the platform to stand between them.
 */

type Moderation = "PENDING" | "APPROVED" | "REJECTED";

interface TutorReview {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: Moderation;
  createdAt: string;
  tutorReply: string | null;
  tutorReplyStatus: Moderation | null;
  canReply: boolean;
}

const STATUS: Record<Moderation, { label: string; tone: "success" | "warning" | "neutral" }> = {
  APPROVED: { label: "Published", tone: "success" },
  PENDING: { label: "Awaiting moderation", tone: "warning" },
  REJECTED: { label: "Not published", tone: "neutral" },
};

export default function TutorReviewsPage() {
  const { authFetch } = useAuth();
  const [reviews, setReviews] = useState<TutorReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/tutor/reviews");
      if (!res.ok) {
        setError("Could not load your reviews. Please try again.");
        return;
      }
      setReviews((await res.json()) as TutorReview[]);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch]);

  useEffect(() => {
    // Awaited inside the effect rather than called bare: that is what lets the
    // set-state-in-effect rule see the writes happen after an await, as in the
    // student pages.
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  if (!reviews) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
      </Container>
    );
  }

  const published = reviews.filter((review) => review.status === "APPROVED");
  const average =
    published.length > 0
      ? published.reduce((sum, review) => sum + review.rating, 0) / published.length
      : null;

  return (
    <Container className="py-6 sm:py-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Reviews</h1>
              <p className="mt-1 text-ink-600">
                Only students you have actually been put in touch with can write
                one.
              </p>
            </div>
            {average !== null && (
              <div className="rounded-2xl bg-brand-50 px-7 py-4 text-center ring-1 ring-brand-200">
                <p className="text-4xl font-bold text-brand-700">
                  {average.toFixed(1)}
                </p>
                <p className="text-xs text-brand-900/70">
                  from {published.length}{" "}
                  {published.length === 1 ? "review" : "reviews"}
                </p>
              </div>
            )}
          </div>
        </section>

        <ErrorBanner message={error} />

        {reviews.length === 0 ? (
          <section className="panel bg-white p-6 text-ink-600 ring-1 ring-ink-200/70 sm:p-8">
            No reviews yet. Students can review you once you have unlocked and
            responded to one of their enquiries.
          </section>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                onReplied={load}
                onError={setError}
              />
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

function ReviewRow({
  review,
  onReplied,
  onError,
}: {
  review: TutorReview;
  onReplied: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const { authFetch } = useAuth();
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    onError(null);

    try {
      const res = await authFetch(`/tutor/reviews/${review.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        onError(body?.message ?? "Could not post your reply.");
        return;
      }

      setComposing(false);
      setText("");
      await onReplied();
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="panel bg-white p-6 ring-1 ring-ink-200/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StarRating rating={review.rating} showNumber />
        <div className="flex items-center gap-2.5">
          <Badge tone={STATUS[review.status].tone}>
            {STATUS[review.status].label}
          </Badge>
          <span className="text-sm text-ink-500">
            {new Date(review.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {review.title && (
        <h2 className="mt-3 font-semibold text-ink-900">{review.title}</h2>
      )}
      {review.body && (
        <p className="mt-1.5 whitespace-pre-line leading-relaxed text-ink-700">
          {review.body}
        </p>
      )}

      {review.tutorReply ? (
        <div className="mt-4 border-l-2 border-brand-300 pl-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-sm font-semibold text-ink-900">Your reply</p>
            {review.tutorReplyStatus && (
              <Badge tone={STATUS[review.tutorReplyStatus].tone}>
                {STATUS[review.tutorReplyStatus].label}
              </Badge>
            )}
          </div>
          <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-700">
            {review.tutorReply}
          </p>
        </div>
      ) : review.canReply ? (
        composing ? (
          <div className="mt-4">
            <label
              htmlFor={`reply-${review.id}`}
              className="text-sm font-medium text-ink-700"
            >
              Your reply — one per review, and it is moderated before it appears
            </label>
            <textarea
              id={`reply-${review.id}`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1.5 w-full rounded-xl border border-ink-200 px-3.5 py-2.5 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="Answer the point rather than the person — this is public."
            />
            <div className="mt-3 flex gap-2.5">
              <Button onClick={submit} disabled={saving || !text.trim()}>
                {saving ? "Posting…" : "Post reply"}
              </Button>
              <Button variant="secondary" onClick={() => setComposing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setComposing(true)}
          >
            Reply
          </Button>
        )
      ) : review.status === "PENDING" ? (
        <p className="mt-4 text-sm text-ink-500">
          You can reply once this review has been published.
        </p>
      ) : null}
    </li>
  );
}
