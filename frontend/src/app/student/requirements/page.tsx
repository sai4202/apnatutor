"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { Badge, ButtonLink, Container, Icon } from "@/components/ui";

/**
 * A parent's enquiries and the tutors who responded.
 *
 * <p>The responding tutors' phone numbers are shown in full here, and that is
 * correct rather than a leak: each of those tutors spent credits specifically to
 * start this conversation, and a parent who cannot call back has been sold
 * nothing.
 */

interface RespondingTutor {
  tutorProfileId: number | null;
  displayName: string | null;
  headline: string | null;
  phone: string | null;
  introMessage: string | null;
  respondedAt: string;
}

interface Requirement {
  id: number;
  subject: string | null;
  gradeLevel: string | null;
  board: string | null;
  location: string | null;
  mode: string;
  budgetAmountPaise: number | null;
  budgetUnit: string | null;
  description: string | null;
  status: "OPEN" | "CAPPED" | "HIRED" | "CLOSED" | "EXPIRED";
  responseCount: number;
  remainingSlots: number;
  expiresAt: string;
  postedAt: string;
  respondingTutors: RespondingTutor[];
}

const MODE_LABELS: Record<string, string> = {
  STUDENT_HOME: "At your home",
  TUTOR_PLACE: "At tutor's place",
  ONLINE: "Online",
};

const STATUS_TONE: Record<
  Requirement["status"],
  "success" | "brand" | "neutral" | "warning"
> = {
  OPEN: "success",
  CAPPED: "brand",
  HIRED: "neutral",
  CLOSED: "neutral",
  EXPIRED: "neutral",
};

const STATUS_LABEL: Record<Requirement["status"], string> = {
  OPEN: "Open",
  CAPPED: "All responses received",
  HIRED: "Hired",
  CLOSED: "Closed",
  EXPIRED: "Expired",
};

function formatMoney(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function MyRequirementsPage() {
  const { authFetch } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/student/requirements");
      if (res.ok) setRequirements(await res.json());
      else setError("Could not load your enquiries.");
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch]);

  useEffect(() => {
    // See the note in student/profile: awaiting inside the effect is what lets
    // React's set-state-in-effect rule see that the writes are post-await.
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function act(id: number, action: "hired" | "close") {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch(`/student/requirements/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.message ?? "Could not update that enquiry.");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!requirements) {
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
              <h1 className="text-2xl font-bold sm:text-3xl">My enquiries</h1>
              <p className="mt-1 text-ink-600">
                Only a handful of tutors can respond to each, so your phone stays
                sane.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/student/profile"
                className="text-sm font-medium text-ink-600 hover:text-brand-700"
              >
                My details
              </Link>
              <ButtonLink href="/post-requirement">
                Post another
                <Icon name="arrow" className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>

        <ErrorBanner message={error} />

        {requirements.length === 0 ? (
          <section className="panel bg-white p-10 text-center ring-1 ring-ink-200/70 sm:p-14">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon name="search" className="h-7 w-7" />
            </span>
            <h2 className="mt-6 text-xl font-semibold">No enquiries yet</h2>
            <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-600">
              Tell us what you need and verified tutors near you will get in
              touch. It is free.
            </p>
            <ButtonLink href="/post-requirement" size="lg" className="mt-7">
              Post your first requirement
              <Icon name="arrow" className="h-5 w-5" />
            </ButtonLink>
          </section>
        ) : (
          requirements.map((requirement) => (
            <section
              key={requirement.id}
              className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-bold">{requirement.subject}</h2>
                    <Badge tone={STATUS_TONE[requirement.status]}>
                      {STATUS_LABEL[requirement.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {[
                      requirement.gradeLevel,
                      requirement.board,
                      requirement.location,
                      MODE_LABELS[requirement.mode],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                {requirement.budgetAmountPaise !== null && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-ink-900">
                      {formatMoney(requirement.budgetAmountPaise)}
                    </p>
                    <p className="text-sm text-ink-500">
                      {requirement.budgetUnit === "PER_MONTH"
                        ? "per month"
                        : "per hour"}
                    </p>
                  </div>
                )}
              </div>

              {requirement.description && (
                <p className="mt-4 leading-relaxed text-ink-600">
                  {requirement.description}
                </p>
              )}

              <div className="mt-5 rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200">
                <p className="text-sm font-semibold text-ink-900">
                  {requirement.responseCount === 0
                    ? "No responses yet"
                    : `${requirement.responseCount} tutor${requirement.responseCount === 1 ? "" : "s"} responded`}
                  {requirement.status === "OPEN" && (
                    <span className="ml-1.5 font-normal text-ink-500">
                      · {requirement.remainingSlots} slot
                      {requirement.remainingSlots === 1 ? "" : "s"} left
                    </span>
                  )}
                </p>

                {requirement.respondingTutors.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {requirement.respondingTutors.map((tutor) => (
                      <li
                        key={tutor.respondedAt + (tutor.phone ?? "")}
                        className="rounded-lg bg-white p-4 ring-1 ring-ink-200"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink-900">
                              {tutor.displayName ?? "Tutor"}
                            </p>
                            {tutor.headline && (
                              <p className="text-sm text-ink-600">
                                {tutor.headline}
                              </p>
                            )}
                          </div>
                          {tutor.phone && (
                            /* Shown in full. This tutor spent credits to start
                               this conversation; a parent who cannot call back
                               has been sold nothing. */
                            <a
                              href={`tel:${tutor.phone}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                            >
                              Call {tutor.phone}
                            </a>
                          )}
                        </div>
                        {tutor.introMessage && (
                          <p className="mt-3 rounded-lg bg-ink-50 p-3 text-sm leading-relaxed text-ink-700">
                            “{tutor.introMessage}”
                          </p>
                        )}
                        {tutor.tutorProfileId && (
                          <Link
                            href={`/tutors/${tutor.tutorProfileId}`}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                          >
                            See full profile
                            <Icon name="arrow" className="h-4 w-4" />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  requirement.status === "OPEN" && (
                    <p className="mt-2 text-sm text-ink-600">
                      Tutors matching your subject and area can see this now.
                      Most parents hear back within a few hours.
                    </p>
                  )
                )}
              </div>

              {(requirement.status === "OPEN" ||
                requirement.status === "CAPPED") && (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-ink-100 pt-4">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(requirement.id, "hired")}
                    className="rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-50"
                  >
                    I hired a tutor
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act(requirement.id, "close")}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50 disabled:opacity-50"
                  >
                    Withdraw this enquiry
                  </button>
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </Container>
  );
}
