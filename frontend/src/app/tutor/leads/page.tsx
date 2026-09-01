"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { Badge, Button, ButtonLink, Container, Icon } from "@/components/ui";

/**
 * The tutor lead feed and the unlock flow.
 *
 * <h2>Why unlocking asks for confirmation</h2>
 *
 * <p>Spending credits is irreversible from the tutor's side — the refund path
 * exists but goes through a human. A one-tap spend on a phone, where a mis-tap is
 * ordinary, would generate exactly the kind of "I didn't mean to" disputes that
 * cost more in support time than the credits are worth. The confirmation shows
 * the cost and the resulting balance, so the decision is made with the numbers
 * visible.
 */

interface LeadPreview {
  id: number;
  subject: string | null;
  gradeLevel: string | null;
  board: string | null;
  area: string | null;
  mode: string;
  budgetAmountPaise: number | null;
  budgetUnit: string | null;
  frequency: string | null;
  preferredTiming: string | null;
  genderPreference: string | null;
  description: string | null;
  unlockCostCredits: number;
  remainingSlots: number;
  postedAt: string;
}

interface UnlockedLead {
  id: number;
  unlockId: number;
  subject: string | null;
  area: string | null;
  mode: string;
  budgetAmountPaise: number | null;
  budgetUnit: string | null;
  description: string | null;
  studentName: string;
  studentPhone: string | null;
  creditsSpent: number;
  unlockedAt: string;
  disputed: boolean;
}

/**
 * Why a tutor is disputing a lead.
 *
 * Codes, not free text — the point of collecting reasons is to count them,
 * so the platform can find the requirements generating bad leads. The labels
 * are phrased as the tutor would say it, not as the database stores it.
 */
const DISPUTE_REASONS: { value: string; label: string }[] = [
  { value: "WRONG_NUMBER", label: "The number does not exist or is wrong" },
  { value: "UNREACHABLE", label: "Called several times, no answer" },
  { value: "ALREADY_HIRED", label: "They had already found a tutor" },
  { value: "NOT_LOOKING", label: "They said they never wanted a tutor" },
  { value: "DUPLICATE_REQUIREMENT", label: "I already paid for this same enquiry" },
  { value: "WRONG_SUBJECT_OR_AREA", label: "Not the subject or area advertised" },
  { value: "ABUSIVE", label: "The contact was abusive" },
  { value: "OTHER", label: "Something else" },
];

const MODE_LABELS: Record<string, string> = {
  STUDENT_HOME: "At student's home",
  TUTOR_PLACE: "At your place",
  ONLINE: "Online",
};

function formatMoney(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function LeadFeedPage() {
  const { authFetch } = useAuth();

  const [leads, setLeads] = useState<LeadPreview[] | null>(null);
  const [myLeads, setMyLeads] = useState<UnlockedLead[]>([]);
  const [balance, setBalance] = useState(0);
  const [tab, setTab] = useState<"feed" | "mine">("feed");
  const [confirming, setConfirming] = useState<LeadPreview | null>(null);
  const [introMessage, setIntroMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<UnlockedLead | null>(null);
  const [disputing, setDisputing] = useState<UnlockedLead | null>(null);
  const [disputeReason, setDisputeReason] = useState(DISPUTE_REASONS[0].value);
  const [disputeDetails, setDisputeDetails] = useState("");
  const [disputeFiled, setDisputeFiled] = useState(false);

  const load = useCallback(async () => {
    try {
      const [feedRes, mineRes, walletRes] = await Promise.all([
        authFetch("/tutor/leads"),
        authFetch("/tutor/leads/mine"),
        authFetch("/tutor/leads/wallet"),
      ]);
      if (feedRes.ok) setLeads((await feedRes.json()).content);
      if (mineRes.ok) setMyLeads(await mineRes.json());
      if (walletRes.ok) setBalance((await walletRes.json()).balance);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch]);

  useEffect(() => {
    // See the note in student/profile.
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function unlock(lead: LeadPreview) {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch(`/tutor/leads/${lead.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ introMessage: introMessage || null }),
      });
      const body = await res.json();

      if (!res.ok) {
        // Branch on the code, never the message. These three are the ones a
        // tutor can actually do something about.
        const friendly: Record<string, string> = {
          INSUFFICIENT_CREDITS:
            "You do not have enough credits for this lead. Top up to continue.",
          LEAD_UNLOCK_CAP_REACHED:
            "Another tutor took the last slot just now. You have not been charged.",
          // Only reachable when two of the tutor's own requests race. The
          // ordinary repeat — a retry after a dropped response — returns the
          // lead they already bought, not an error.
          LEAD_ALREADY_UNLOCKED:
            "That went through already. Check My leads for the contact details.",
          REQUIREMENT_NOT_OPEN:
            "This enquiry is no longer accepting responses. You have not been charged.",
        };
        setError(friendly[body.code] ?? body.message);
        setConfirming(null);
        await load();
        return;
      }

      setJustUnlocked(body);
      setConfirming(null);
      setIntroMessage("");
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function fileDispute(lead: UnlockedLead) {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/tutor/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unlockId: lead.unlockId,
          reason: disputeReason,
          details: disputeDetails || null,
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(
          body.code === "REFUND_NOT_ALLOWED"
            ? body.message
            : "Could not raise that dispute.",
        );
        setDisputing(null);
        return;
      }

      setDisputing(null);
      setDisputeDetails("");
      setDisputeFiled(true);
      await load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (!leads) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
      </Container>
    );
  }

  return (
    <Container className="py-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Student enquiries</h1>
              <p className="mt-1 text-ink-600">
                Matching what and where you teach.
              </p>
            </div>
            {/* Balance is always visible. A tutor deciding whether to spend
                should never have to navigate away to find out what they have —
                and it links to the wallet, so topping up is one tap from the
                moment they discover they cannot afford a lead. */}
            <Link
              href="/tutor/wallet"
              className="rounded-xl bg-brand-50 px-5 py-3 text-center ring-1 ring-brand-200 transition-colors hover:bg-brand-100"
            >
              <p className="text-2xl font-bold text-brand-700">{balance}</p>
              <p className="text-xs text-brand-900/70">credits</p>
            </Link>
          </div>

          <div className="mt-6 flex gap-2">
            {(["feed", "mine"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === value
                    ? "bg-brand-600 text-white"
                    : "text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
                }`}
              >
                {value === "feed"
                  ? `New enquiries (${leads.length})`
                  : `My leads (${myLeads.length})`}
              </button>
            ))}
          </div>
        </section>

        <ErrorBanner message={error} />

        {justUnlocked && (
          <section className="panel bg-success-50 p-6 ring-1 ring-success-600/20 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-600 text-white">
                <Icon name="check" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-ink-900">
                  Unlocked — here are the details
                </h2>
                <p className="mt-1 text-sm text-ink-600">
                  {justUnlocked.creditsSpent} credits spent. Call soon: the
                  parent is talking to up to four other tutors.
                </p>
                <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-ink-200">
                  <p className="font-semibold text-ink-900">
                    {justUnlocked.studentName}
                  </p>
                  {justUnlocked.studentPhone && (
                    <a
                      href={`tel:${justUnlocked.studentPhone}`}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
                    >
                      Call {justUnlocked.studentPhone}
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setJustUnlocked(null)}
                  className="mt-4 text-sm font-medium text-ink-500 hover:text-ink-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === "feed" &&
          (leads.length === 0 ? (
            <section className="panel bg-white p-10 text-center ring-1 ring-ink-200/70 sm:p-14">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon name="users" className="h-7 w-7" />
              </span>
              <h2 className="mt-6 text-xl font-semibold">No enquiries right now</h2>
              <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-600">
                You will see enquiries matching the subjects and areas on your
                profile. Adding more subjects or areas widens what reaches you.
              </p>
              <Link
                href="/tutor/onboarding"
                className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"
              >
                Update my profile
                <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </section>
          ) : (
            leads.map((lead) => (
              <section
                key={lead.id}
                className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{lead.subject}</h2>
                    <p className="mt-1 text-sm text-ink-500">
                      {[
                        lead.gradeLevel,
                        lead.board,
                        lead.area,
                        MODE_LABELS[lead.mode],
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {lead.budgetAmountPaise !== null && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-ink-900">
                        {formatMoney(lead.budgetAmountPaise)}
                      </p>
                      <p className="text-sm text-ink-500">
                        {lead.budgetUnit === "PER_MONTH" ? "per month" : "per hour"}
                      </p>
                    </div>
                  )}
                </div>

                {lead.description && (
                  <p className="mt-4 leading-relaxed text-ink-600">
                    {lead.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  {lead.preferredTiming && (
                    <span className="rounded-md bg-ink-100 px-2.5 py-1 text-ink-700">
                      {lead.preferredTiming}
                    </span>
                  )}
                  {lead.frequency && (
                    <span className="rounded-md bg-ink-100 px-2.5 py-1 text-ink-700">
                      {lead.frequency}
                    </span>
                  )}
                  {lead.genderPreference && lead.genderPreference !== "ANY" && (
                    <span className="rounded-md bg-ink-100 px-2.5 py-1 text-ink-700">
                      Prefers a {lead.genderPreference.toLowerCase()} tutor
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-4">
                  <div className="flex items-center gap-3 text-sm">
                    {/* Not "x of 5" — the cap is an admin setting locked onto
                        each enquiry at posting time, so two enquiries on screen
                        can legitimately have different caps. */}
                    <Badge tone={lead.remainingSlots <= 2 ? "warning" : "neutral"}>
                      {lead.remainingSlots} slot
                      {lead.remainingSlots === 1 ? "" : "s"} left
                    </Badge>
                    <span className="text-ink-500">
                      Costs{" "}
                      <strong className="text-ink-900">
                        {lead.unlockCostCredits} credits
                      </strong>
                    </span>
                  </div>

                  {/* When they cannot afford it, the button becomes the way to
                      fix that. A disabled "Not enough credits" is a dead end at
                      exactly the moment the tutor wanted to spend money. */}
                  {balance < lead.unlockCostCredits ? (
                    <ButtonLink href="/tutor/wallet">
                      Top up to unlock
                      <Icon name="wallet" className="h-4 w-4" />
                    </ButtonLink>
                  ) : (
                    <Button
                      disabled={busy}
                      onClick={() => {
                        setConfirming(lead);
                        setError(null);
                      }}
                    >
                      Unlock contact details
                      <Icon name="arrow" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </section>
            ))
          ))}

        {tab === "mine" &&
          (myLeads.length === 0 ? (
            <section className="panel bg-white p-10 text-center ring-1 ring-ink-200/70">
              <p className="text-ink-600">
                You have not unlocked any enquiries yet.
              </p>
            </section>
          ) : (
            myLeads.map((lead) => (
              <section
                key={lead.unlockId}
                className="panel bg-white p-6 ring-1 ring-ink-200/70"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">{lead.subject}</h2>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {[lead.area, MODE_LABELS[lead.mode]].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-3 font-semibold text-ink-900">
                      {lead.studentName}
                    </p>
                  </div>
                  {lead.studentPhone && (
                    <a
                      href={`tel:${lead.studentPhone}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Call {lead.studentPhone}
                    </a>
                  )}
                </div>

                {/* Deliberately here rather than buried in a help page. A refund
                    path that is hard to find is one the tutor concludes does not
                    exist, and that belief is what stops the next purchase. */}
                <div className="mt-4 border-t border-ink-100 pt-3">
                  {lead.disputed ? (
                    <Badge tone="neutral">Dispute under review</Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDisputing(lead);
                        setDisputeReason(DISPUTE_REASONS[0].value);
                        setError(null);
                      }}
                      className="text-sm font-medium text-ink-500 hover:text-danger-600"
                    >
                      This lead was no good
                    </button>
                  )}
                </div>
              </section>
            ))
          ))}
      </div>

      {/* Confirmation. Spending credits is irreversible from the tutor's side, and
          a mis-tap on a phone is ordinary — so the cost and the resulting balance
          are both shown before the decision. */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold">Unlock this enquiry?</h2>
            <p className="mt-2 leading-relaxed text-ink-600">
              This spends{" "}
              <strong className="text-ink-900">
                {confirming.unlockCostCredits} credits
              </strong>{" "}
              and reveals the parent&apos;s name and phone number. You will have{" "}
              <strong className="text-ink-900">
                {balance - confirming.unlockCostCredits}
              </strong>{" "}
              left.
            </p>

            <label className="mt-5 block text-sm font-medium text-ink-800">
              Introduce yourself
              <span className="ml-1 font-normal text-ink-500">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              placeholder="I teach Class 10 maths in Gachibowli and have a slot free on weekday evenings."
              className="mt-1.5 w-full rounded-lg bg-white p-3 text-sm ring-1 ring-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <p className="mt-1 text-xs text-ink-500">
              Shown to the parent alongside your profile. A specific message gets
              answered far more often than none.
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1"
                disabled={busy}
                onClick={() => void unlock(confirming)}
              >
                {busy ? "Unlocking…" : `Spend ${confirming.unlockCostCredits} credits`}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setConfirming(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Raising a dispute. Reasons are a fixed list because the platform needs
          to count them — free text tells us about one bad lead, a code tells us
          which enquiries keep producing them. */}
      {disputing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold">What went wrong?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              If this lead was not what it claimed to be, we will return the{" "}
              {disputing.creditsSpent} credits. A person reads every dispute.
            </p>

            <div className="mt-5 space-y-1.5">
              {DISPUTE_REASONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ring-1 transition-colors ${
                    disputeReason === option.value
                      ? "bg-brand-50 text-brand-800 ring-brand-300"
                      : "text-ink-700 ring-ink-200 hover:bg-ink-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="disputeReason"
                    value={option.value}
                    checked={disputeReason === option.value}
                    onChange={() => setDisputeReason(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>

            <textarea
              rows={2}
              value={disputeDetails}
              onChange={(e) => setDisputeDetails(e.target.value)}
              placeholder="Anything else that would help us check (optional)"
              className="mt-4 w-full rounded-lg bg-white p-3 text-sm ring-1 ring-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />

            <div className="mt-5 flex gap-3">
              <Button
                className="flex-1"
                disabled={busy}
                onClick={() => void fileDispute(disputing)}
              >
                {busy ? "Sending…" : "Raise dispute"}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setDisputing(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {disputeFiled && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-ink-900 px-5 py-4 text-white shadow-lg">
          <p className="text-sm">
            Dispute raised. We will look into it and let you know — usually
            within a working day.
          </p>
          <button
            type="button"
            onClick={() => setDisputeFiled(false)}
            className="mt-2 text-xs font-medium text-white/70 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
    </Container>
  );
}
