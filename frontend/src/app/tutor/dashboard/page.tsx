"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { Badge, ButtonLink, Container, Icon } from "@/components/ui";

/**
 * The tutor's home once signed in.
 *
 * <p>Deliberately shows what is <em>incomplete</em> before anything else. A tutor
 * whose profile is not published has exactly one useful action available, and
 * burying it under statistics they do not have yet would be decoration.
 *
 * <p>The lead feed and wallet arrive in M3 and M4; the placeholders below say so
 * rather than showing zeroes, which would read as "nobody wants you" instead of
 * "not built yet".
 */

interface Verification {
  id: number;
  type: "EMAIL" | "ID" | "EDUCATION";
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
}

interface Profile {
  displayName: string | null;
  headline: string | null;
  profileCompleteness: number;
  published: boolean;
  missingForPublish: string[];
  subjects: { subjectId: number; name: string }[];
}

const VERIFICATION_LABELS: Record<Verification["type"], string> = {
  ID: "Government ID",
  EDUCATION: "Qualifications",
  EMAIL: "Email address",
};

export default function TutorDashboard() {
  const { authFetch, signOut, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [level, setLevel] = useState<string>("PHONE_VERIFIED");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [profileRes, verificationRes, levelRes] = await Promise.all([
        authFetch("/tutor/profile"),
        authFetch("/tutor/verification"),
        authFetch("/tutor/verification/level"),
      ]);
      if (profileRes.ok) setProfile(await profileRes.json());
      if (verificationRes.ok) setVerifications(await verificationRes.json());
      if (levelRes.ok) setLevel((await levelRes.text()).replaceAll('"', ""));
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitDocument(type: "ID" | "EDUCATION", file: File) {
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await authFetch(`/tutor/verification/${type}`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const body = await res.json();
      setError(body.message ?? "Could not upload that document.");
      return;
    }
    void load();
  }

  if (!profile) {
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                {profile.displayName ?? "Welcome"}
              </h1>
              <p className="mt-1 text-ink-600">
                {profile.headline ?? user?.phone}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={profile.published ? "success" : "warning"}>
                  {profile.published ? "Live" : "Not published"}
                </Badge>
                <Badge tone={level === "PHONE_VERIFIED" ? "neutral" : "brand"}>
                  <Icon name="shield" className="h-3.5 w-3.5" />
                  {level.replaceAll("_", " ").toLowerCase()}
                </Badge>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm font-medium text-ink-500 hover:text-danger-600"
            >
              Sign out
            </button>
          </div>
        </section>

        <ErrorBanner message={error} />

        {/* The single most useful thing on the page when a profile is not live. */}
        {!profile.published && (
          <section className="panel bg-brand-600 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white">
              Finish your profile to start getting enquiries
            </h2>
            <p className="mt-2 text-brand-100">
              You are {profile.profileCompleteness}% complete.
              {profile.missingForPublish.length > 0 &&
                ` Next: ${profile.missingForPublish[0].toLowerCase()}.`}
            </p>
            <ButtonLink
              href="/tutor/onboarding"
              variant="secondary"
              size="lg"
              className="mt-6"
            >
              Continue setup
              <Icon name="arrow" className="h-5 w-5" />
            </ButtonLink>
          </section>
        )}

        <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <h2 className="text-lg font-bold">Get verified</h2>
          <p className="mt-1.5 text-sm text-ink-600">
            Verified tutors get noticeably more enquiries — a parent is deciding
            who to let into their home. Documents are reviewed by our team and are
            never shown publicly.
          </p>

          <div className="mt-6 space-y-3">
            {(["ID", "EDUCATION"] as const).map((type) => {
              const existing = verifications.find((v) => v.type === type);
              return (
                <div
                  key={type}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200"
                >
                  <div>
                    <p className="font-medium text-ink-900">
                      {VERIFICATION_LABELS[type]}
                    </p>
                    {existing?.status === "REJECTED" && (
                      <p className="mt-0.5 text-sm text-danger-700">
                        {existing.rejectionReason}
                      </p>
                    )}
                  </div>

                  {existing && existing.status !== "REJECTED" ? (
                    <Badge tone={existing.status === "APPROVED" ? "success" : "neutral"}>
                      {existing.status === "APPROVED" ? "Verified" : "Under review"}
                    </Badge>
                  ) : (
                    <label className="cursor-pointer text-sm font-semibold text-brand-600 hover:text-brand-700">
                      {existing?.status === "REJECTED" ? "Upload again" : "Upload"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void submitDocument(type, file);
                        }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <h2 className="text-lg font-bold">Student enquiries</h2>
          {/* Not zeroes. A "0 enquiries" counter reads as "nobody wants you"
              rather than "this is not built yet", and that difference matters to
              someone deciding whether to bother finishing their profile. */}
          <p className="mt-2 text-ink-600">
            The lead feed opens in M3, once students can post requirements. Your
            profile and verification are what get you ready for it.
          </p>
          <Link
            href="/for-tutors"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            How enquiries will work
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </Container>
  );
}
