"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { PageHeader } from "@/components/admin/Bits";
import { Button } from "@/components/ui";

/**
 * Credit corrections — M5-06.2.
 *
 * <h2>Why a grant needs a written reason</h2>
 *
 * <p>{@code credit_transactions} is append-only: a mistake here cannot be edited away, only
 * compensated with a second entry that is equally permanent. The reason is what makes the pair
 * legible to whoever reads the ledger next, and the backend rejects a blank one — an unexplained
 * grant is indistinguishable from a bug.
 *
 * <p>The balance lookup also reports the ledger difference. That number should always be zero: it
 * is the cached wallet balance minus the sum of the ledger, and anything else means the cache and
 * the ledger disagree, which is a serious bug rather than something to correct by granting the
 * difference.
 */

interface Balance {
  tutorUserId: number;
  balance: number;
  ledgerDifference: number;
}

export default function AdminCreditsPage() {
  const { authFetch } = useAuth();
  const [lookupId, setLookupId] = useState("");
  const [balance, setBalance] = useState<Balance | null>(null);
  const [credits, setCredits] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function lookup() {
    setError(null);
    setNotice(null);
    const res = await authFetch(`/admin/credits/${lookupId.trim()}`);
    if (!res.ok) {
      setBalance(null);
      setError("No wallet for that tutor id.");
      return;
    }
    setBalance((await res.json()) as Balance);
  }

  async function grant() {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/admin/credits/grant", {
        method: "POST",
        body: JSON.stringify({
          tutorUserId: Number(lookupId.trim()),
          credits: Number(credits),
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? "Could not grant those credits.");
        return;
      }

      const updated = (await res.json()) as Balance;
      setBalance(updated);
      setNotice(`Granted. The balance is now ${updated.balance} credits.`);
      setCredits("");
      setReason("");
    } finally {
      setBusy(false);
    }
  }

  const canGrant =
    lookupId.trim() !== "" && Number(credits) > 0 && reason.trim().length > 0 && !busy;

  return (
    <>
      <PageHeader
        title="Credits"
        description="The only sanctioned way to change a balance. It writes an ADMIN_ADJUSTMENT entry — the ledger itself cannot be edited."
      />

      <div className="max-w-xl space-y-4">
        <ErrorBanner message={error} />

        <section className="rounded-xl bg-white p-5 ring-1 ring-ink-200/80">
          <label className="block text-sm font-semibold text-ink-800" htmlFor="tutor-id">
            Tutor user id
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="tutor-id"
              inputMode="numeric"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              placeholder="e.g. 42"
              className="h-10 flex-1 rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
            />
            <Button size="sm" variant="secondary" disabled={!lookupId.trim()} onClick={() => void lookup()}>
              Look up
            </Button>
          </div>

          {balance && (
            <div className="mt-4 rounded-lg bg-ink-50 px-4 py-3">
              <p className="text-2xl font-bold tabular-nums text-ink-900">
                {balance.balance} credits
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                Tutor #{balance.tutorUserId}
              </p>
              {balance.ledgerDifference !== 0 && (
                <p className="mt-2 rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700 ring-1 ring-danger-600/20">
                  <span className="font-semibold">
                    Ledger mismatch of {balance.ledgerDifference}.
                  </span>{" "}
                  The cached balance disagrees with the sum of the ledger. Do not grant the
                  difference — the ledger is authoritative, and this is a bug to be found rather
                  than papered over.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 ring-1 ring-ink-200/80">
          <h2 className="font-semibold text-ink-900">Grant credits</h2>
          <p className="mt-0.5 text-sm text-ink-600">
            Manual grants never expire. These are usually goodwill after a support problem, and
            putting a clock on an apology would be a second insult.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-ink-700" htmlFor="credits">
                Credits
              </label>
              <input
                id="credits"
                inputMode="numeric"
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
                placeholder="1 – 10,000"
                className="mt-1 h-10 w-full rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700" htmlFor="reason">
                Reason
              </label>
              <textarea
                id="reason"
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Goodwill credit after a support issue"
                className="mt-1 w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
              />
              <p className="mt-1 text-xs text-ink-500">
                Goes into the ledger permanently. It cannot be edited later.
              </p>
            </div>

            {notice && (
              <p className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700 ring-1 ring-success-600/20">
                {notice}
              </p>
            )}

            <Button disabled={!canGrant} onClick={() => void grant()}>
              {busy ? "Granting…" : "Grant credits"}
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
