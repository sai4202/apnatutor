"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { EmptyQueue, PageHeader, ReasonAction, Spinner } from "@/components/admin/Bits";
import { Badge, Button } from "@/components/ui";
import { ago, rupees, shortDate, type ModerationView, type Page } from "@/lib/admin";

/**
 * Enquiry moderation — M5-05.6 / M5-06.2.
 *
 * <h2>Removing an enquiry costs money, and the screen says so before you do it</h2>
 *
 * <p>A takedown refunds every tutor who paid to reach the poster, in the same transaction. That is
 * correct — a lead we remove as fake was a lead we should never have sold — but it means the button
 * is not free, and the card shows the bill before it is pressed rather than reporting it afterwards.
 *
 * <p>The default tab is the flagged queue: enquiries three different tutors have disputed. One
 * tutor disputing many leads may just be bad at phone calls; three separate tutors disputing the
 * same enquiry is a fact about that enquiry.
 */

type Tab = "flagged" | "removed" | "all";

const TABS: { key: Tab; label: string; path: string; blurb: string }[] = [
  {
    key: "flagged",
    label: "Flagged",
    path: "/admin/requirements/flagged",
    blurb:
      "Live enquiries three or more different tutors have disputed. This is the queue worth working.",
  },
  {
    key: "removed",
    label: "Taken down",
    path: "/admin/requirements/removed",
    blurb: "What has been removed and why. Kept visible because every removal refunded somebody.",
  },
  {
    key: "all",
    label: "All",
    path: "/admin/requirements",
    blurb: "Everything, newest first. For looking something up after a complaint.",
  },
];

export default function AdminRequirementsPage() {
  const { authFetch } = useAuth();
  const [tab, setTab] = useState<Tab>("flagged");
  const [rows, setRows] = useState<Page<ModerationView> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const active = TABS.find((entry) => entry.key === tab)!;

  const load = useCallback(async () => {
    setRows(null);
    try {
      const res = await authFetch(active.path);
      if (!res.ok) {
        setError("Could not load enquiries.");
        return;
      }
      setError(null);
      setRows((await res.json()) as Page<ModerationView>);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch, active.path]);

  useEffect(() => {
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function remove(id: number, reason: string) {
    const res = await authFetch(`/admin/requirements/${id}/remove`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Could not remove that enquiry.");
      return;
    }

    const outcome = (await res.json()) as { tutorsRefunded: number };
    setNotice(
      outcome.tutorsRefunded > 0
        ? `Taken down. ${outcome.tutorsRefunded} ${
            outcome.tutorsRefunded === 1 ? "tutor was" : "tutors were"
          } refunded.`
        : "Taken down. No tutor had paid for it.",
    );
    await load();
  }

  async function restore(id: number) {
    const res = await authFetch(`/admin/requirements/${id}/restore`, { method: "POST" });
    if (!res.ok) {
      setError("Could not restore that enquiry.");
      return;
    }
    setNotice("Restored. The refunds already issued are not reversed.");
    await load();
  }

  return (
    <>
      <PageHeader title="Enquiries" description={active.blurb} />

      <div className="space-y-4">
        <ErrorBanner message={error} />

        {notice && (
          <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200">
            {notice}
          </p>
        )}

        <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => {
                setTab(entry.key);
                setNotice(null);
              }}
              aria-pressed={tab === entry.key}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === entry.key
                  ? "bg-white text-ink-900 shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {!rows ? (
          <Spinner />
        ) : rows.content.length === 0 ? (
          <EmptyQueue>
            {tab === "flagged"
              ? "Nothing flagged. No enquiry has been disputed by three different tutors."
              : tab === "removed"
                ? "Nothing has been taken down."
                : "No enquiries yet."}
          </EmptyQueue>
        ) : (
          <ul className="space-y-3">
            {rows.content.map((row) => (
              <li key={row.id}>
                <EnquiryCard
                  row={row}
                  onRemove={(reason) => remove(row.id, reason)}
                  onRestore={() => restore(row.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function EnquiryCard({
  row,
  onRemove,
  onRestore,
}: {
  row: ModerationView;
  onRemove: (reason: string) => Promise<void>;
  onRestore: () => Promise<void>;
}) {
  const removed = row.status === "REMOVED";
  const paidFor = row.unlockCount > 0;

  return (
    <article className="rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink-900">
            {row.subject ?? "Unknown subject"}
            {row.gradeLevel && <span className="text-ink-500"> · {row.gradeLevel}</span>}
          </h3>
          <p className="text-sm text-ink-600">
            {row.location ?? "No location"} · {row.mode.replace("_", " ").toLowerCase()}
            {row.budgetAmountPaise !== null && (
              <> · {rupees(row.budgetAmountPaise)} {row.budgetUnit === "PER_HOUR" ? "/hr" : "/mo"}</>
            )}
          </p>
          {/* The student's own number, which no other view of a requirement carries. It is the
              only way a fake is recognised: the same number posting eleven enquiries. */}
          <p className="mt-1 text-sm tabular-nums text-ink-500">
            Posted by #{row.studentId} · {row.studentPhone ?? "no phone on file"} ·{" "}
            {ago(row.postedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {row.disputedByTutors > 0 && (
            <Badge tone="warning">
              {row.disputedByTutors} {row.disputedByTutors === 1 ? "dispute" : "disputes"}
            </Badge>
          )}
          <Badge tone={removed ? "neutral" : "brand"}>
            {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </div>

      {row.description && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
          {row.description}
        </p>
      )}

      {removed ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3">
          <p className="text-sm text-ink-600">
            Taken down {shortDate(row.removedAt)}
            {row.removalReason && <> — {row.removalReason}</>}
          </p>
          <Button size="sm" variant="secondary" onClick={() => void onRestore()}>
            Restore
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-2 border-t border-ink-100 pt-3">
          <p className="text-sm text-ink-600">
            {paidFor ? (
              <>
                <span className="font-semibold text-ink-900">
                  {row.unlockCount} {row.unlockCount === 1 ? "tutor has" : "tutors have"} paid
                </span>{" "}
                {row.unlockCostCredits} credits each to reach this student. Removing it refunds
                every one of them.
              </>
            ) : (
              <>No tutor has paid for this lead, so removing it costs nothing.</>
            )}
          </p>
          <ReasonAction
            label="Take down"
            title="Why is this enquiry being removed?"
            placeholder="Sent to the student, and recorded against the removal"
            onConfirm={onRemove}
          />
        </div>
      )}
    </article>
  );
}
