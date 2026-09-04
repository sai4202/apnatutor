"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { EmptyQueue, PageHeader, ReasonAction, Spinner } from "@/components/admin/Bits";
import { Badge } from "@/components/ui";
import {
  ACTION_FOR_SUBJECT,
  ago,
  dateTime,
  humanise,
  type Page,
  type TriageView,
} from "@/lib/admin";

/**
 * Abuse triage — M5-09.2.
 *
 * <h2>Deciding is not acting, and the screen keeps them apart</h2>
 *
 * <p>Upholding a report records that a moderator agreed with it. It does not suspend, remove or
 * unpublish anything — each card links to the screen that owns the action instead. Wiring them
 * together would turn a handful of coordinated reports into a way to remove a competitor, and would
 * skip the one step where a person looks.
 *
 * <p>The number to read first is how many <em>different</em> people reported the same subject. One
 * person filing repeatedly is one opinion; five arriving independently is a fact.
 */
export default function AdminReportsPage() {
  const { authFetch } = useAuth();
  const [decided, setDecided] = useState(false);
  const [rows, setRows] = useState<Page<TriageView> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    try {
      const res = await authFetch(`/admin/reports?decided=${decided}`);
      if (!res.ok) {
        setError("Could not load reports.");
        return;
      }
      setError(null);
      setRows((await res.json()) as Page<TriageView>);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch, decided]);

  useEffect(() => {
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function decide(id: number, action: "uphold" | "dismiss", note: string) {
    const res = await authFetch(`/admin/reports/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ note }),
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
        title="Reports"
        description="Deciding a report is not acting on it. Upholding records the judgement and tells the reporter; suspending, removing or unpublishing is done from the screen that owns it."
      />

      <div className="space-y-4">
        <ErrorBanner message={error} />

        <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
          {[false, true].map((value) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setDecided(value)}
              aria-pressed={decided === value}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                decided === value
                  ? "bg-white text-ink-900 shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              {value ? "All reports" : "Open"}
            </button>
          ))}
        </div>

        {!rows ? (
          <Spinner />
        ) : rows.content.length === 0 ? (
          <EmptyQueue>
            {decided ? "Nothing has been reported yet." : "Nothing waiting. Every report has been decided."}
          </EmptyQueue>
        ) : (
          <ul className="space-y-3">
            {rows.content.map((row) => (
              <li key={row.id}>
                <ReportCard
                  row={row}
                  onDecide={(action, note) => decide(row.id, action, note)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function ReportCard({
  row,
  onDecide,
}: {
  row: TriageView;
  onDecide: (action: "uphold" | "dismiss", note: string) => Promise<void>;
}) {
  const open = row.status === "OPEN";
  const action = ACTION_FOR_SUBJECT[row.subjectType];
  const corroborated = row.distinctReporters > 1;

  return (
    <article className="rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-ink-900">
            {humanise(row.reason)}
          </h2>
          <p className="text-sm text-ink-600">
            {humanise(row.subjectType)} #{row.subjectId} ·{" "}
            {row.source === "SYSTEM" ? (
              <span className="italic">raised by the platform</span>
            ) : (
              <>reported by #{row.reporterId}</>
            )}{" "}
            · {ago(row.filedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {corroborated && (
            <Badge tone="warning">
              {row.distinctReporters} separate reporters
            </Badge>
          )}
          {row.totalReports > 1 && !corroborated && (
            <Badge tone="neutral">{row.totalReports} reports total</Badge>
          )}
          <Badge
            tone={
              row.status === "OPEN"
                ? "brand"
                : row.status === "UPHELD"
                  ? "warning"
                  : "neutral"
            }
          >
            {humanise(row.status)}
          </Badge>
        </div>
      </div>

      {row.details && (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
          {row.details}
        </p>
      )}

      {open ? (
        <div className="mt-3 space-y-2 border-t border-ink-100 pt-3">
          <p className="text-sm text-ink-600">
            Neither decision changes the account.{" "}
            <Link href={action.href} className="font-medium text-brand-700 underline">
              {action.label}
            </Link>{" "}
            to act on it.
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <ReasonAction
              label="Uphold"
              title="What did you find?"
              placeholder="Sent to whoever reported it"
              variant="primary"
              onConfirm={(note) => onDecide("uphold", note)}
            />
            <ReasonAction
              label="Dismiss"
              title="Why is there nothing to act on?"
              placeholder="Sent to the reporter — silence teaches them not to bother"
              onConfirm={(note) => onDecide("dismiss", note)}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-600">
          {humanise(row.status)} {dateTime(row.reviewedAt)}
          {row.reviewedBy && ` by admin #${row.reviewedBy}`}
          {row.decisionNote && <> — {row.decisionNote}</>}
        </p>
      )}
    </article>
  );
}
