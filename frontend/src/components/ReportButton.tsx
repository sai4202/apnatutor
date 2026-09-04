"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";

/**
 * Reports a tutor, review or enquiry — M5-09.1.
 *
 * <h2>Deliberately quiet</h2>
 *
 * <p>A small text link, not a button competing with "Contact this tutor". The overwhelming majority
 * of visitors have nothing to report, and a prominent report control on every profile suggests
 * there is usually something wrong — which is both untrue and bad for the tutors it sits under.
 *
 * <p>Signed-out visitors are told to sign in rather than shown the form. Reporting requires an
 * account by design: an anonymous report button is a harassment tool with no cost to use, and
 * requiring an account makes abuse of it attributable, which is most of the deterrent.
 */

const REASONS: { value: string; label: string }[] = [
  { value: "FAKE_PROFILE", label: "This profile is not who it says it is" },
  { value: "MISLEADING_CLAIMS", label: "Qualifications or experience look false" },
  { value: "HARASSMENT", label: "Abusive or threatening behaviour" },
  { value: "OFF_PLATFORM_SOLICITATION", label: "Asked to arrange this off the platform" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Something else" },
];

export function ReportButton({
  subjectType,
  subjectId,
  label = "Report this profile",
}: {
  subjectType: "TUTOR" | "STUDENT" | "REVIEW" | "REQUIREMENT";
  subjectId: number;
  label?: string;
}) {
  const { user, authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].value);
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (state === "sent") {
    return (
      <p className="text-sm text-success-700">
        Thank you. A moderator will look at this, and you will hear the outcome either way.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-ink-500 underline underline-offset-2 hover:text-ink-700"
      >
        {label}
      </button>
    );
  }

  if (!user) {
    return (
      <p className="text-sm text-ink-600">
        Please{" "}
        <a href="/login" className="font-medium text-brand-700 underline">
          sign in
        </a>{" "}
        to report this. We ask for an account so reports can be followed up.
      </p>
    );
  }

  async function send() {
    setState("sending");
    setError(null);
    try {
      const res = await authFetch("/reports", {
        method: "POST",
        body: JSON.stringify({
          subjectType,
          subjectId,
          reason,
          details: details.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          body?.code === "CONFLICT"
            ? "You have already reported this, and it is still being looked at."
            : (body?.message ?? "Could not send that report."),
        );
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("Could not reach the server.");
      setState("idle");
    }
  }

  return (
    <div className="rounded-lg bg-ink-50 p-4 ring-1 ring-ink-200">
      <h3 className="text-sm font-semibold text-ink-900">What is wrong?</h3>
      <p className="mt-0.5 text-xs text-ink-500">
        A moderator reads every report. Nothing is removed automatically.
      </p>

      <label className="mt-3 block text-xs font-medium text-ink-700" htmlFor="report-reason">
        Reason
      </label>
      <select
        id="report-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
      >
        {REASONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="mt-3 block text-xs font-medium text-ink-700" htmlFor="report-details">
        Anything that would help (optional)
      </label>
      <textarea
        id="report-details"
        rows={3}
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        className="mt-1 w-full rounded-lg border-0 px-3 py-2 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
      />

      {error && <p className="mt-2 text-sm text-danger-700">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={state === "sending"} onClick={() => void send()}>
          {state === "sending" ? "Sending…" : "Send report"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
