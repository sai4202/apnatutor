"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { EmptyQueue, PageHeader, ReasonAction, Spinner } from "@/components/admin/Bits";
import { StarRating } from "@/components/StarRating";
import { Badge, Button } from "@/components/ui";
import { ago, type Page, type ReviewAdminView } from "@/lib/admin";

/**
 * Review moderation — M5-06.2.
 *
 * <h2>Two queues, not one</h2>
 *
 * <p>The backend serves pending reviews and pending replies separately, and this screen keeps them
 * apart. A review waiting for a decision is a student who thinks they were ignored; a reply waiting
 * for a decision is a tutor who cannot answer criticism already published about them. They have
 * different urgency and different consequences, and merging them buries whichever is rarer.
 *
 * <p>Rejecting a review demands a reason and rejecting a reply does not — that asymmetry is the
 * backend's, and it is right: the student is told why their words will not appear, while a tutor
 * whose reply is refused still has a published review they can answer again.
 */

type Queue = "reviews" | "replies";

export default function AdminReviewsPage() {
  const { authFetch } = useAuth();
  const [queue, setQueue] = useState<Queue>("reviews");
  const [rows, setRows] = useState<Page<ReviewAdminView> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const path = queue === "reviews" ? "/admin/reviews/pending" : "/admin/reviews/replies/pending";

  const load = useCallback(async () => {
    setRows(null);
    try {
      const res = await authFetch(path);
      if (!res.ok) {
        setError("Could not load the queue.");
        return;
      }
      setError(null);
      setRows((await res.json()) as Page<ReviewAdminView>);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch, path]);

  useEffect(() => {
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function act(id: number, action: string, reason?: string) {
    const res = await authFetch(`/admin/reviews/${id}/${action}`, {
      method: "POST",
      body: reason ? JSON.stringify({ reason }) : undefined,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Could not record that decision.");
      return;
    }
    setNotice(null);
    await load();
  }

  async function recompute() {
    const res = await authFetch("/admin/reviews/recompute-ratings", { method: "POST" });
    if (!res.ok) {
      setError("Could not rebuild the ratings.");
      return;
    }
    setNotice(`Rebuilt ${await res.json()} tutor ratings from the reviews table.`);
  }

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Search ranks on these, so a review sitting here unmoderated is a tutor ranked on nothing."
        actions={
          <Button size="sm" variant="secondary" onClick={() => void recompute()}>
            Rebuild ratings
          </Button>
        }
      />

      <div className="space-y-4">
        <ErrorBanner message={error} />

        {notice && (
          <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200">
            {notice}
          </p>
        )}

        <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
          {(["reviews", "replies"] as Queue[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setQueue(key)}
              aria-pressed={queue === key}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                queue === key ? "bg-white text-ink-900 shadow-xs" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              {key === "reviews" ? "Reviews" : "Tutor replies"}
            </button>
          ))}
        </div>

        {!rows ? (
          <Spinner />
        ) : rows.content.length === 0 ? (
          <EmptyQueue>
            {queue === "reviews"
              ? "No reviews waiting. Every one has been decided."
              : "No replies waiting."}
          </EmptyQueue>
        ) : (
          <ul className="space-y-3">
            {rows.content.map((row) => (
              <li key={row.id}>
                <article className="rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <StarRating rating={row.rating} />
                      <p className="mt-1 text-sm text-ink-600">
                        Tutor #{row.tutorId} · written {ago(row.createdAt)}
                      </p>
                    </div>
                    <Badge tone="warning">
                      {queue === "reviews" ? "Awaiting moderation" : "Reply awaiting moderation"}
                    </Badge>
                  </div>

                  <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2.5">
                    {row.title && (
                      <p className="font-semibold text-ink-900">{row.title}</p>
                    )}
                    {row.body ? (
                      <p className="whitespace-pre-line text-sm text-ink-700">{row.body}</p>
                    ) : (
                      <p className="text-sm italic text-ink-500">A rating with no words.</p>
                    )}
                  </div>

                  {queue === "replies" && row.tutorReply && (
                    <div className="mt-2 rounded-lg border-l-2 border-brand-300 bg-brand-50/60 px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                        The tutor&apos;s answer
                      </p>
                      <p className="whitespace-pre-line text-sm text-ink-700">{row.tutorReply}</p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-start gap-2 border-t border-ink-100 pt-3">
                    {queue === "reviews" ? (
                      <>
                        <Button size="sm" onClick={() => void act(row.id, "approve")}>
                          Publish
                        </Button>
                        <ReasonAction
                          label="Reject"
                          title="Why will this not be published?"
                          placeholder="Sent to the student — silence reads as quietly binning criticism"
                          onConfirm={(reason) => act(row.id, "reject", reason)}
                        />
                      </>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => void act(row.id, "reply/approve")}>
                          Publish reply
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => void act(row.id, "reply/reject")}
                        >
                          Refuse reply
                        </Button>
                        <p className="w-full text-xs text-ink-500">
                          Refusing the answer leaves the review itself published. The two are
                          decided independently.
                        </p>
                      </>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
