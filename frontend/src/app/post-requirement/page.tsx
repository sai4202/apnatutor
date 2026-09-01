"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL, type City, type SubjectNode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { Badge, Button, ButtonLink, Container, Icon } from "@/components/ui";

/**
 * Post a requirement — the top-of-funnel conversion point.
 *
 * <h2>Two decisions that shape this form</h2>
 *
 * <p><strong>Everything below the subject is optional.</strong> Each additional
 * required field is a chance to abandon, and none of the rest is needed to match
 * an enquiry to a tutor. A sparse requirement that exists beats a detailed one
 * that was never submitted.
 *
 * <p><strong>Signing in comes last, not first.</strong> A visitor arriving from
 * Google should be able to fill the form and only then be asked who they are.
 * Demanding an account before they have expressed what they want loses most of
 * them — so the form works unauthenticated and prompts at submit.
 */

interface Catalog {
  subjects: SubjectNode[];
  cities: City[];
  grades: { id: number; name: string; slug: string }[];
  boards: { id: number; name: string; slug: string }[];
}

const MODES = [
  { value: "STUDENT_HOME", label: "At my home" },
  { value: "TUTOR_PLACE", label: "At the tutor's place" },
  { value: "ONLINE", label: "Online" },
];

export default function PostRequirementPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  // Kept in state so the price quote can update as the parent types, which is
  // the only way they see what a tutor pays to reach them.
  const [budget, setBudget] = useState("");
  const [mode, setMode] = useState("STUDENT_HOME");
  const [quote, setQuote] = useState<number | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [subjects, cities, grades, boards] = await Promise.all([
          fetch(`${API_BASE_URL}/public/catalog/subjects`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/public/catalog/cities`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/public/catalog/grade-levels`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/public/catalog/boards`).then((r) => r.json()),
        ]);
        setCatalog({ subjects, cities, grades, boards });
      } catch {
        setError("Could not reach the server. Is the backend running?");
      }
    }
    void loadCatalog();
  }, []);

  // The quote is informational — students never pay. It is shown because a
  // parent who understands that tutors pay to reach them treats the response
  // they get as worth something.
  const refreshQuote = useCallback(async () => {
    const paise = budget ? Math.round(Number(budget) * 100) : null;
    try {
      const params = new URLSearchParams({ mode });
      if (paise) params.set("budgetAmountPaise", String(paise));
      const res = await authFetch(`/student/requirements/quote?${params}`);
      if (res.ok) setQuote((await res.json()).credits);
    } catch {
      // A missing quote is cosmetic; never block posting on it.
    }
  }, [budget, mode, authFetch]);

  useEffect(() => {
    // See the note in student/profile.
    async function run() {
      if (user?.role === "STUDENT") await refreshQuote();
    }
    void run();
  }, [user, refreshQuote]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      router.push("/login");
      return;
    }

    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const optionalNumber = (key: string) => {
      const value = form.get(key);
      return value && value !== "" ? Number(value) : null;
    };

    try {
      const res = await authFetch("/student/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: Number(form.get("subjectId")),
          gradeLevelId: optionalNumber("gradeLevelId"),
          boardId: optionalNumber("boardId"),
          locationId: optionalNumber("locationId"),
          mode: form.get("mode"),
          // Entered in rupees, sent in paise — no money is ever a float on the wire.
          budgetAmountPaise: budget ? Math.round(Number(budget) * 100) : null,
          budgetUnit: form.get("budgetUnit"),
          frequency: form.get("frequency") || null,
          preferredTiming: form.get("preferredTiming") || null,
          genderPreference: form.get("genderPreference") || null,
          description: form.get("description") || null,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Could not post that. Please check the form.");
        return;
      }

      setPosted(true);
      router.push("/student/requirements");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  if (!catalog || loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
      </Container>
    );
  }

  const leafSubjects = catalog.subjects.flatMap((category) =>
    category.children.map((child) => ({ ...child, category: category.name })),
  );

  return (
    <Container className="py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Badge tone="success">
            <Icon name="check" className="h-3.5 w-3.5" />
            Free — always
          </Badge>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            Tell us what you need
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-600">
            Takes under a minute. At most five verified tutors will contact you.
          </p>
        </div>

        <div className="panel mt-8 bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <ErrorBanner message={error} />

          {user && user.role !== "STUDENT" && (
            <div className="mb-5 rounded-lg bg-warning-50 px-4 py-3 text-sm text-ink-700 ring-1 ring-warning-600/20">
              You are signed in as a tutor. Requirements are posted by students
              and parents — sign out and sign in with a student account to post
              one.
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            <Field label="What do you need help with?" required>
              <select name="subjectId" required className={inputClass}>
                <option value="">Choose a subject…</option>
                {leafSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.category} — {subject.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Class or level" hint="Optional">
                <select name="gradeLevelId" className={inputClass}>
                  <option value="">Any</option>
                  {catalog.grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Board" hint="Optional">
                <select name="boardId" className={inputClass}>
                  <option value="">Any</option>
                  {catalog.boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <span className="block text-sm font-medium text-ink-800">
                Where should classes happen?
              </span>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {MODES.map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-lg px-4 py-3 text-center text-sm font-medium ring-1 transition-colors ${
                      mode === option.value
                        ? "bg-brand-50 text-brand-700 ring-brand-400"
                        : "text-ink-600 ring-ink-200 hover:bg-ink-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={mode === option.value}
                      onChange={(e) => setMode(e.target.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="City or area" hint="Optional">
                <select name="locationId" className={inputClass}>
                  <option value="">Any</option>
                  {catalog.cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Budget (₹)" hint="Optional, but it helps tutors reply">
                <input
                  name="budget"
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onBlur={() => void refreshQuote()}
                  placeholder="3000"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Per">
              <select name="budgetUnit" defaultValue="PER_MONTH" className={inputClass}>
                <option value="PER_MONTH">Month</option>
                <option value="PER_HOUR">Hour</option>
              </select>
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="How often?" hint="Optional">
                <input
                  name="frequency"
                  placeholder="Twice a week"
                  className={inputClass}
                />
              </Field>
              <Field label="Preferred timings" hint="Optional">
                <input
                  name="preferredTiming"
                  placeholder="Weekday evenings after 5 PM"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Tutor gender preference"
              hint="Optional. Many families have one, and stating it saves everyone time."
            >
              <select name="genderPreference" defaultValue="" className={inputClass}>
                <option value="">No preference</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </select>
            </Field>

            <Field label="Anything else?" hint="Optional">
              <textarea
                name="description"
                rows={3}
                placeholder="What your child is finding difficult, what you have tried, anything a tutor should know."
                className={inputClass}
              />
            </Field>

            {quote !== null && (
              /* Shown for transparency. A parent who understands that tutors pay
                 to reach them treats the response as worth something. */
              <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-200">
                <p className="text-sm leading-relaxed text-brand-900">
                  <strong className="font-semibold">You pay nothing.</strong> A
                  tutor spends {quote} credit{quote === 1 ? "" : "s"} to see your
                  contact details, which is why you will only ever hear from
                  people who are genuinely interested.
                </p>
              </div>
            )}

            {user ? (
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={busy || posted || user.role !== "STUDENT"}
              >
                {busy ? "Posting…" : "Post my requirement"}
                <Icon name="arrow" className="h-5 w-5" />
              </Button>
            ) : (
              /* The form is fillable before signing in, deliberately. Demanding
                 an account before someone has said what they want loses most of
                 them. */
              <div className="rounded-xl bg-ink-50 p-5 text-center ring-1 ring-ink-200">
                <p className="text-sm text-ink-700">
                  Sign in with your mobile number to post. Takes ten seconds and
                  keeps your details private.
                </p>
                <ButtonLink href="/login" size="lg" className="mt-4">
                  Sign in and post
                  <Icon name="arrow" className="h-5 w-5" />
                </ButtonLink>
              </div>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          Your number is never shown publicly. Only tutors who spend credits to
          respond can see it, and at most five can.{" "}
          <Link href="/for-tutors" className="font-medium text-brand-600 hover:text-brand-700">
            How it works for tutors
          </Link>
        </p>
      </div>
    </Container>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg bg-white px-3.5 py-2.5 text-base ring-1 ring-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-danger-600">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
      {children}
    </div>
  );
}
