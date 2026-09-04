"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { EmptyQueue, PageHeader, ReasonAction, Spinner } from "@/components/admin/Bits";
import { Badge, Button } from "@/components/ui";
import { ago, type DisputeEntry, type Page } from "@/lib/admin";

/**
 * Bad-lead disputes — M5-06.2.
 *
 * <p>The tutor's own dispute rate is shown on every card because it is the context that changes the
 * decision: the same complaint from someone who has disputed one lead in fifty reads very
 * differently from someone who has disputed half of them. It is deliberately not a filter or a
 * cutoff — a tutor whose leads really are bad is the person a threshold would punish, and they are
 * the one already being let down.
 *
 * <p>An approval frees the enquiry's response slot as well as returning the credits, so a parent
 * promised five responses who got one unusable one still gets five.
 */

const HIGH_RATE = 0.3;

export default function AdminDisputesPage() {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<Page<DisputeEntry> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/admin/refunds");
      if (!res.ok) {
        setError("Could not load the queue.");
        return;
      }
      setError(null);
      setRows((await res.json()) as Page<DisputeEntry>);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch]);

  useEffect(() => {
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function decide(id: number, action: "approve" | "reject", note?: string) {
    const res = await authFetch(`/admin/refunds/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ note: note ?? "" }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Could not record that decision.");
      return;
    }
    await load();
  }

  return (
    <>
      <PageHeader
        title="Disputes"
        description="A tutor who buys a lead and reaches a disconnected number has been sold nothing. Upholding the dispute returns the credits and frees the enquiry's response slot."
      />

      <div className="space-y-4">
        <ErrorBanner message={error} />

        {!rows ? (
          <Spinner />
        ) : rows.content.length === 0 ? (
          <EmptyQueue>No disputes waiting.</EmptyQueue>
        ) : (
          <ul className="space-y-3">
            {rows.content.map((row) => {
              const rate = Math.round(row.tutorDisputeRate * 100);
              const high = row.tutorDisputeRate > HIGH_RATE;

              return (
                <li key={row.id}>
                  <article className="rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-ink-900">
                          {row.reason.replaceAll("_", " ").toLowerCase()}
                        </h3>
                        <p className="text-sm text-ink-600">
                          Tutor #{row.tutorId} · enquiry #{row.requirementId} ·{" "}
                          {row.credits} credits · raised {ago(row.createdAt)}
                        </p>
                      </div>
                      <Badge tone={high ? "warning" : "neutral"}>
                        {rate}% of their leads disputed
                      </Badge>
                    </div>

                    {row.details && (
                      <p className="mt-3 whitespace-pre-line rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                        {row.details}
                      </p>
                    )}

                    {high && (
                      <p className="mt-2 text-xs text-warning-600">
                        A high rate is a reason to look closely, not a reason to refuse. It can
                        equally mean this tutor is being sent bad leads.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-start gap-2 border-t border-ink-100 pt-3">
                      <Button size="sm" onClick={() => void decide(row.id, "approve")}>
                        Uphold and refund
                      </Button>
                      <ReasonAction
                        label="Decline"
                        title="Why is this dispute not upheld?"
                        placeholder="Sent to the tutor — a declined dispute with no reason costs their trust twice"
                        onConfirm={(note) => decide(row.id, "reject", note)}
                      />
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
