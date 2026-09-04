"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { EmptyQueue, PageHeader, ReasonAction, Spinner } from "@/components/admin/Bits";
import { Badge, Button } from "@/components/ui";
import { ago, type Page, type VerificationView } from "@/lib/admin";
import { DocumentViewer } from "./DocumentViewer";

/**
 * The verification queue — M5-06.2, with the document viewer at M5-06.3.
 *
 * <p>This queue is the platform's only real trust signal, and it is the one that gates the signup
 * bonus. A submission sitting here for a week is a tutor who verified their ID, got nothing, and
 * concluded the platform does not work — so the age of each item is shown as prominently as its
 * type.
 */
export default function AdminVerificationsPage() {
  const { authFetch } = useAuth();
  const [rows, setRows] = useState<Page<VerificationView> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/admin/verifications/pending");
      if (!res.ok) {
        setError("Could not load the queue.");
        return;
      }
      setError(null);
      setRows((await res.json()) as Page<VerificationView>);
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

  async function decide(id: number, action: "approve" | "reject", reason?: string) {
    const res = await authFetch(`/admin/verifications/${id}/${action}`, {
      method: "POST",
      body: reason ? JSON.stringify({ reason }) : undefined,
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
        title="Verifications"
        description="Approving an ID grants the signup bonus, so this queue is also where a tutor's first credits come from. Oldest first."
      />

      <div className="space-y-4">
        <ErrorBanner message={error} />

        {!rows ? (
          <Spinner />
        ) : rows.content.length === 0 ? (
          <EmptyQueue>Nothing waiting. Every submission has been reviewed.</EmptyQueue>
        ) : (
          <ul className="space-y-3">
            {rows.content.map((row) => (
              <li key={row.id}>
                <article className="rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-ink-900">
                        {row.type === "ID"
                          ? "Government ID"
                          : row.type === "EDUCATION"
                            ? "Education certificate"
                            : "Email"}
                      </h3>
                      <p className="text-sm text-ink-600">
                        Tutor #{row.userId} · submitted {ago(row.submittedAt)}
                      </p>
                    </div>
                    <Badge tone="warning">Awaiting review</Badge>
                  </div>

                  {row.documentUrl ? (
                    <DocumentViewer storageKey={row.documentUrl} />
                  ) : (
                    <p className="mt-3 text-sm text-ink-500">
                      No document was attached to this submission.
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-start gap-2 border-t border-ink-100 pt-3">
                    <Button size="sm" onClick={() => void decide(row.id, "approve")}>
                      Approve
                    </Button>
                    <ReasonAction
                      label="Reject"
                      title="Why is this being rejected?"
                      placeholder="Sent to the tutor — they need to know what to send instead"
                      onConfirm={(reason) => decide(row.id, "reject", reason)}
                    />
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
