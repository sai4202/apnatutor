"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { EmptyQueue, PageHeader, Spinner } from "@/components/admin/Bits";
import { Badge } from "@/components/ui";
import {
  dateTime,
  formatState,
  type AuditOutcome,
  type AuditRow,
  type Page,
} from "@/lib/admin";

/**
 * The audit log — M5-08.4.
 *
 * <h2>Read-only, and there is no way to make it otherwise</h2>
 *
 * <p>There is no create, edit or delete here, and no endpoint behind one: entries are written as a
 * consequence of acting, never by asking, and the table itself refuses UPDATE and DELETE. That is
 * the whole value of the screen — a record somebody can edit is a record that proves nothing.
 *
 * <p>Reading this page is itself audited, like every other admin route. Who has been reading the
 * record of who did what is a fair question to be able to answer.
 */

const TARGET_TYPES = [
  "USER",
  "REQUIREMENT",
  "REVIEW",
  "REFUND_REQUEST",
  "VERIFICATION",
  "SETTING",
  "PRICING_BAND",
];

const OUTCOMES: AuditOutcome[] = ["SUCCEEDED", "REFUSED", "FAILED"];

export default function AdminAuditPage() {
  const { authFetch } = useAuth();
  const [targetType, setTargetType] = useState("");
  const [targetId, setTargetId] = useState("");
  const [outcome, setOutcome] = useState<AuditOutcome | "">("");
  const [rows, setRows] = useState<Page<AuditRow> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const query = new URLSearchParams();
    if (targetType) query.set("targetType", targetType);
    if (targetId.trim()) query.set("targetId", targetId.trim());
    if (outcome) query.set("outcome", outcome);

    try {
      const res = await authFetch(`/admin/audit?${query}`);
      if (!res.ok) {
        setError("Could not load the audit log.");
        return;
      }
      setError(null);
      setRows((await res.json()) as Page<AuditRow>);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch, targetType, targetId, outcome]);

  useEffect(() => {
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every admin action, newest first. Append-only — the database refuses to edit or delete an entry, including for us."
      />

      <div className="space-y-4">
        <ErrorBanner message={error} />

        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 ring-1 ring-ink-200/80">
          <select
            value={targetType}
            onChange={(event) => setTargetType(event.target.value)}
            aria-label="Filter by what was acted on"
            className="h-9 rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Anything</option>
            {TARGET_TYPES.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
          <input
            value={targetId}
            onChange={(event) => setTargetId(event.target.value)}
            inputMode="numeric"
            placeholder="Its id"
            aria-label="Filter by target id"
            className="h-9 w-28 rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as AuditOutcome | "")}
            aria-label="Filter by outcome"
            className="h-9 rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Any outcome</option>
            {OUTCOMES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <p className="flex items-center px-1 text-xs text-ink-500">
            Filter by target to answer the question support actually asks: what has been done
            to this account?
          </p>
        </div>

        {!rows ? (
          <Spinner />
        ) : rows.content.length === 0 ? (
          <EmptyQueue>Nothing recorded matching those filters.</EmptyQueue>
        ) : (
          <ul className="space-y-2">
            {rows.content.map((row) => (
              <li key={row.id}>
                <Entry row={row} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/**
 * One entry, with the state diff behind a disclosure.
 *
 * <p>Collapsed by default. The log is scanned far more often than it is read — the usual task is
 * "find the thing that happened to this account", and expanded JSON on every row makes that
 * scrolling instead of scanning.
 */
function Entry({ row }: { row: AuditRow }) {
  const before = formatState(row.beforeState);
  const after = formatState(row.afterState);
  const hasDiff = before !== null || after !== null;

  return (
    <article className="rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-mono text-sm font-semibold text-ink-900">{row.action}</h2>
          <p className="mt-0.5 text-sm text-ink-600">
            {row.actorId ? (
              <>
                {row.actorRole?.toLowerCase() ?? "someone"} #{row.actorId}
              </>
            ) : (
              <span className="italic">no readable actor</span>
            )}
            {row.targetType && (
              <>
                {" → "}
                {row.targetType.replaceAll("_", " ").toLowerCase()}
                {row.targetId !== null && ` #${row.targetId}`}
              </>
            )}
            {" · "}
            {dateTime(row.at)}
          </p>
          {row.summary && (
            <p className="mt-1 text-sm text-ink-700">{row.summary}</p>
          )}
        </div>

        <Badge
          tone={
            row.outcome === "SUCCEEDED"
              ? "success"
              : row.outcome === "REFUSED"
                ? "warning"
                : "neutral"
          }
        >
          {row.outcome.charAt(0) + row.outcome.slice(1).toLowerCase()}
          {row.httpStatus !== null && ` ${row.httpStatus}`}
        </Badge>
      </div>

      {hasDiff && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-brand-700">
            What changed
          </summary>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <StatePanel label="Before" json={before} />
            <StatePanel label="After" json={after} />
          </div>
        </details>
      )}

      <p className="mt-2 text-xs text-ink-400">
        {row.httpMethod} {row.path}
        {row.ipAddress && ` · from ${row.ipAddress}`}
        {row.correlationId && ` · trace ${row.correlationId}`}
      </p>
    </article>
  );
}

function StatePanel({ label, json }: { label: string; json: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <pre className="mt-0.5 overflow-x-auto rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-700">
        {json ?? "—"}
      </pre>
    </div>
  );
}
