"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";

/**
 * The small pieces every admin screen needs.
 *
 * <p>Kept together rather than one file each: they are only meaningful inside the console, and
 * splitting six twenty-line components across six files makes them harder to keep consistent than
 * to find.
 */

/** A screen's title bar. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-600">{description}</p>
        )}
      </div>
      {actions}
    </header>
  );
}

/**
 * One number on the dashboard.
 *
 * <p>`hint` carries the denominator. A tile that says "12%" and nothing else is unreadable at this
 * stage of the platform, where the honest reading is usually "3 of 25".
 */
export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const accent = {
    neutral: "text-ink-900",
    good: "text-success-700",
    warn: "text-warning-600",
  }[tone];

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

/**
 * What a queue shows when there is nothing in it.
 *
 * <p>Worth a component of its own because an empty queue is the goal state, and a blank panel is
 * indistinguishable from a failed request. Saying so explicitly is the difference.
 */
export function EmptyQueue({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white px-6 py-12 text-center ring-1 ring-ink-200/80">
      <p className="text-sm text-ink-500">{children}</p>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
    </div>
  );
}

/**
 * An action that requires a written reason before it will fire.
 *
 * <p>The reason is not a formality. Every destructive action in this console is shown to the person
 * it happens to — a suspended user reads it at the login screen, a student reads it when their
 * enquiry disappears, a tutor reads it when a dispute is declined. It is also the only thing that
 * makes the decision reviewable by whoever picks up the appeal, so the button stays disabled until
 * something has been typed rather than accepting a blank string the backend would reject anyway.
 */
export function ReasonAction({
  label,
  title,
  placeholder,
  variant = "danger",
  onConfirm,
}: {
  label: string;
  title: string;
  placeholder: string;
  variant?: "danger" | "primary";
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="w-full rounded-lg bg-ink-50 p-3 ring-1 ring-ink-200">
      <label className="block text-xs font-semibold text-ink-700" htmlFor={title}>
        {title}
      </label>
      <textarea
        id={title}
        rows={2}
        autoFocus
        value={reason}
        placeholder={placeholder}
        onChange={(event) => setReason(event.target.value)}
        className="mt-1.5 w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
      />
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          variant={variant}
          disabled={busy || reason.trim().length === 0}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm(reason.trim());
              setOpen(false);
              setReason("");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Working…" : "Confirm"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
