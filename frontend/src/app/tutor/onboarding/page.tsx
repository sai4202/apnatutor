"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { API_BASE_URL, type City, type SubjectNode } from "@/lib/api";
import { Button, Container, Icon } from "@/components/ui";

/**
 * The tutor onboarding wizard.
 *
 * <h2>Why the server drives the steps</h2>
 *
 * The API already returns a completeness score and a plain-language
 * `missingForPublish` list. This screen renders those rather than keeping its own
 * idea of what "complete" means — two definitions of done would drift, and the
 * one the publish endpoint enforces is the one that matters.
 *
 * <h2>Why each step saves immediately</h2>
 *
 * Every step is a separate PUT, saved as you leave it, rather than one big form
 * submitted at the end. Filling in a tutor profile is genuinely long, it will be
 * done on a phone, and it will be interrupted. Losing twenty minutes of typing to
 * a dropped connection is how a half-finished profile becomes an abandoned one.
 *
 * A consequence worth stating: the profile exists in a partial state throughout.
 * That is safe because nothing is visible until `publish`, which the backend
 * refuses below 60% complete.
 */

type StepId = "basics" | "subjects" | "teaching" | "fees" | "photo";

const STEPS: { id: StepId; title: string; blurb: string }[] = [
  { id: "basics", title: "About you", blurb: "Name, headline and how you teach" },
  { id: "subjects", title: "Subjects", blurb: "What you teach" },
  { id: "teaching", title: "Where", blurb: "Modes and areas you cover" },
  { id: "fees", title: "Fees", blurb: "What you charge" },
  { id: "photo", title: "Photo", blurb: "Parents contact a face" },
];

interface OwnerProfile {
  id: number;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  experienceYears: number;
  feeMinPaise: number | null;
  feeMaxPaise: number | null;
  feeUnit: "PER_HOUR" | "PER_MONTH" | null;
  feeNegotiable: boolean;
  teachingModes: string[];
  travelRadiusKm: number;
  languages: string[];
  offersDemo: boolean;
  availabilityNote: string | null;
  subjects: { subjectId: number; name: string }[];
  locations: { locationId: number; displayName: string }[];
  profileCompleteness: number;
  published: boolean;
  missingForPublish: string[];
}

const MODES = [
  { value: "STUDENT_HOME", label: "At the student's home" },
  { value: "TUTOR_PLACE", label: "At my place" },
  { value: "ONLINE", label: "Online" },
];

export default function OnboardingPage() {
  const { authFetch } = useAuth();

  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [step, setStep] = useState<StepId>("basics");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [subjectTree, setSubjectTree] = useState<SubjectNode[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const load = useCallback(async () => {
    try {
      const [profileRes, subjectsRes, citiesRes] = await Promise.all([
        authFetch("/tutor/profile"),
        fetch(`${API_BASE_URL}/public/catalog/subjects`),
        fetch(`${API_BASE_URL}/public/catalog/cities`),
      ]);
      if (profileRes.ok) setProfile(await profileRes.json());
      if (subjectsRes.ok) setSubjectTree(await subjectsRes.json());
      if (citiesRes.ok) setCities(await citiesRes.json());
    } catch {
      setError("Could not reach the server. Is the backend running?");
    }
  }, [authFetch]);

  useEffect(() => {
    // See the note in student/profile.
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  /** One save path for every step, so the error and success handling cannot diverge. */
  async function save(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await authFetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.message ?? "Could not save that.");
        return false;
      }
      setProfile(payload);
      setSaved(true);
      return true;
    } catch {
      setError("Could not reach the server.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      // No Content-Type header: the browser must set the multipart boundary itself.
      const res = await authFetch("/tutor/profile/photo", { method: "POST", body: form });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.message ?? "Could not upload that image.");
        return;
      }
      setProfile(payload);
      setSaved(true);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch("/tutor/profile/publish", { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.message ?? "Could not publish yet.");
        return;
      }
      setProfile(payload);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
      </Container>
    );
  }

  const selectedSubjectIds = new Set(profile.subjects.map((s) => s.subjectId));
  const selectedLocationIds = new Set(profile.locations.map((l) => l.locationId));

  return (
    <Container className="py-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Your tutor profile</h1>
              <p className="mt-1.5 text-ink-600">
                {profile.published
                  ? "Live — students can find you."
                  : "Not live yet. Reach 60% to publish."}
              </p>
            </div>
            <Link
              href="/tutor/dashboard"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Dashboard
            </Link>
          </div>

          {/* The score comes from the server, so this bar and the publish
              endpoint can never disagree about what "complete" means. */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-ink-700">Profile completeness</span>
              <span className="font-bold text-brand-600">
                {profile.profileCompleteness}%
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-500"
                style={{ width: `${profile.profileCompleteness}%` }}
              />
            </div>
          </div>

          {profile.missingForPublish.length > 0 && (
            <div className="mt-5 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-200">
              <p className="text-sm font-semibold text-brand-900">Still to do</p>
              <ul className="mt-2 space-y-1.5">
                {profile.missingForPublish.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-brand-900/85"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Steps are tabs, not a forced sequence. A tutor who only wants to fix
            their fees should not have to walk through four other screens. */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {STEPS.map((s, index) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setStep(s.id);
                setSaved(false);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                step === s.id
                  ? "bg-brand-600 text-white"
                  : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-brand-50"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  step === s.id ? "bg-white/25" : "bg-ink-100"
                }`}
              >
                {index + 1}
              </span>
              {s.title}
            </button>
          ))}
        </div>

        <div className="panel mt-5 bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              {STEPS.find((s) => s.id === step)?.title}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {STEPS.find((s) => s.id === step)?.blurb}
            </p>
          </div>

          <ErrorBanner message={error} />
          {saved && !error && (
            <p className="mb-4 flex items-center gap-2 text-sm font-medium text-success-700">
              <Icon name="check" className="h-4 w-4" />
              Saved
            </p>
          )}

          {step === "basics" && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                void save("/tutor/profile/basics", {
                  displayName: form.get("displayName"),
                  headline: form.get("headline"),
                  bio: form.get("bio"),
                  experienceYears: Number(form.get("experienceYears") ?? 0),
                  languages: String(form.get("languages") ?? "")
                    .split(",")
                    .map((l) => l.trim())
                    .filter(Boolean),
                  offersDemo: form.get("offersDemo") === "on",
                  availabilityNote: form.get("availabilityNote"),
                });
              }}
            >
              <Field label="Your name" hint="As you want students to see it">
                <input
                  name="displayName"
                  defaultValue={profile.displayName ?? ""}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Headline"
                hint="One line. This is what a parent reads first."
              >
                <input
                  name="headline"
                  defaultValue={profile.headline ?? ""}
                  placeholder="Maths & Science, Classes 6–10"
                  className={inputClass}
                />
              </Field>

              <Field
                label="About your teaching"
                hint="At least 80 characters. How you teach matters more than where you studied."
              >
                <textarea
                  name="bio"
                  rows={5}
                  defaultValue={profile.bio ?? ""}
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Years of experience">
                  <input
                    name="experienceYears"
                    type="number"
                    min={0}
                    max={70}
                    defaultValue={profile.experienceYears}
                    className={inputClass}
                  />
                </Field>
                <Field label="Languages" hint="Comma separated">
                  <input
                    name="languages"
                    defaultValue={profile.languages.join(", ")}
                    placeholder="English, Telugu, Hindi"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Availability" hint="Free text for now">
                <input
                  name="availabilityNote"
                  defaultValue={profile.availabilityNote ?? ""}
                  placeholder="Weekday evenings after 5 PM"
                  className={inputClass}
                />
              </Field>

              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="offersDemo"
                  defaultChecked={profile.offersDemo}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600"
                />
                I offer a free demo class
              </label>

              <Button type="submit" size="lg" disabled={busy}>
                {busy ? "Saving…" : "Save and continue"}
              </Button>
            </form>
          )}

          {step === "subjects" && (
            <div className="space-y-5">
              <p className="text-sm text-ink-600">
                Pick everything you teach. Only specific subjects can be selected —
                a category like &ldquo;School Tuition&rdquo; is for browsing.
              </p>
              <div className="max-h-96 space-y-4 overflow-y-auto rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200">
                {subjectTree.map((category) => (
                  <div key={category.slug}>
                    <p className="text-sm font-semibold text-ink-900">
                      {category.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {category.children.map((child) => {
                        const selected = selectedSubjectIds.has(child.id);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              const next = new Set(selectedSubjectIds);
                              if (selected) next.delete(child.id);
                              else next.add(child.id);
                              void save("/tutor/profile/subjects", {
                                subjects: [...next].map((subjectId) => ({ subjectId })),
                              });
                            }}
                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              selected
                                ? "bg-brand-600 text-white"
                                : "bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-brand-50"
                            }`}
                          >
                            {child.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-ink-500">
                {profile.subjects.length} selected
              </p>
            </div>
          )}

          {step === "teaching" && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                void save("/tutor/profile/teaching", {
                  teachingModes: form.getAll("modes"),
                  travelRadiusKm: Number(form.get("travelRadiusKm") ?? 0),
                  locationIds: form.getAll("locations").map(Number),
                });
              }}
            >
              <fieldset>
                <legend className="text-sm font-medium text-ink-800">
                  How do you teach?
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {MODES.map((mode) => (
                    <label
                      key={mode.value}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-ink-50 px-4 py-3 text-sm ring-1 ring-ink-200 hover:bg-brand-50"
                    >
                      <input
                        type="checkbox"
                        name="modes"
                        value={mode.value}
                        defaultChecked={profile.teachingModes.includes(mode.value)}
                        className="h-4 w-4 rounded border-ink-300 text-brand-600"
                      />
                      {mode.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field
                label="Areas you travel to"
                hint="Skip this if you only teach online."
              >
                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg bg-ink-50 p-3 ring-1 ring-ink-200">
                  {cities.map((city) => (
                    <label
                      key={city.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        name="locations"
                        value={city.id}
                        defaultChecked={selectedLocationIds.has(city.id)}
                        className="h-4 w-4 rounded border-ink-300 text-brand-600"
                      />
                      {city.name}
                      <span className="text-xs text-ink-400">{city.state}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="How far will you travel? (km)">
                <input
                  name="travelRadiusKm"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={profile.travelRadiusKm}
                  className={inputClass}
                />
              </Field>

              <Button type="submit" size="lg" disabled={busy}>
                {busy ? "Saving…" : "Save and continue"}
              </Button>
            </form>
          )}

          {step === "fees" && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const toPaise = (rupees: FormDataEntryValue | null) =>
                  rupees && String(rupees).trim() !== ""
                    ? Math.round(Number(rupees) * 100)
                    : null;
                void save("/tutor/profile/fees", {
                  // Entered in rupees, sent in paise. The API is integer paise
                  // throughout so no fee is ever a floating-point value.
                  feeMinPaise: toPaise(form.get("feeMin")),
                  feeMaxPaise: toPaise(form.get("feeMax")),
                  feeUnit: form.get("feeUnit"),
                  feeNegotiable: form.get("feeNegotiable") === "on",
                });
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="From (₹)">
                  <input
                    name="feeMin"
                    type="number"
                    min={0}
                    defaultValue={
                      profile.feeMinPaise ? profile.feeMinPaise / 100 : ""
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Up to (₹)" hint="Optional">
                  <input
                    name="feeMax"
                    type="number"
                    min={0}
                    defaultValue={
                      profile.feeMaxPaise ? profile.feeMaxPaise / 100 : ""
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Per">
                <select
                  name="feeUnit"
                  defaultValue={profile.feeUnit ?? "PER_MONTH"}
                  className={inputClass}
                >
                  <option value="PER_MONTH">Month</option>
                  <option value="PER_HOUR">Hour</option>
                </select>
              </Field>

              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="feeNegotiable"
                  defaultChecked={profile.feeNegotiable}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600"
                />
                My fees are negotiable
              </label>

              <Button type="submit" size="lg" disabled={busy}>
                {busy ? "Saving…" : "Save and continue"}
              </Button>
            </form>
          )}

          {step === "photo" && (
            <div className="space-y-5">
              <p className="text-sm text-ink-600">
                Profiles with a photo get noticeably more enquiries. A parent
                deciding who to let into their home looks at the face first.
              </p>

              {profile.photoUrl && (
                /* A plain <img>, not next/image. The source is the backend's own
                   file endpoint on a different origin, so the optimizer would
                   need it added to remotePatterns and would then proxy every
                   upload through the Next server. This is a 128px preview the
                   tutor just uploaded and is the only person who sees. */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_BASE_URL}/public/files/${profile.photoUrl}`}
                  alt="Your profile photo"
                  className="h-32 w-32 rounded-2xl object-cover ring-1 ring-ink-200"
                />
              )}

              <Field label="Upload a photo" hint="JPG, PNG or WebP, up to 5 MB">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadPhoto(file);
                  }}
                  className="block w-full text-sm text-ink-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
                />
              </Field>
            </div>
          )}
        </div>

        {/* Publish sits outside the steps: it applies to the whole profile, not
            to whichever one happens to be open. */}
        <div className="panel mt-5 bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">
                {profile.published ? "Your profile is live" : "Ready to go live?"}
              </h2>
              <p className="mt-1 text-sm text-ink-600">
                {profile.published
                  ? "Students can find you in search."
                  : `You need 60% to publish. You are at ${profile.profileCompleteness}%.`}
              </p>
            </div>

            {profile.published ? (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const res = await authFetch("/tutor/profile/unpublish", {
                    method: "POST",
                  });
                  if (res.ok) setProfile(await res.json());
                  setBusy(false);
                }}
              >
                Hide my profile
              </Button>
            ) : (
              <Button
                size="lg"
                disabled={busy || profile.profileCompleteness < 60}
                onClick={() => void publish()}
              >
                Publish my profile
                <Icon name="arrow" className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg bg-white px-3.5 py-2.5 text-base ring-1 ring-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-800">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
      {children}
    </div>
  );
}
