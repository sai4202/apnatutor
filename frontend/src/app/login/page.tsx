"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Container, Icon } from "@/components/ui";

/**
 * Phone + OTP sign-in.
 *
 * A Client Component — one of the few on the site — because it is genuinely
 * interactive: two steps, live validation, and a resend timer.
 *
 * <h2>Where the access token goes</h2>
 *
 * Into React state, and nowhere else. Not localStorage, not sessionStorage:
 * anything readable by JavaScript is readable by a successful XSS. The refresh
 * token is already an HttpOnly cookie the browser sends automatically, so on a
 * page reload the correct move is to call /auth/refresh and get a new access
 * token rather than to persist this one.
 *
 * That refresh-on-load belongs in a shared auth provider, which is task M1-11.3.
 * Until then this page proves the flow end to end.
 */

type Step = "phone" | "code";
type Role = "STUDENT" | "TUTOR";

/**
 * Seeded by the backend only when `apnatutor.dev.enabled` is true. Admin is
 * listed for completeness — the admin console is M5-06.
 */
const TEST_ACCOUNTS: { label: string; phone: string; role: Role }[] = [
  { label: "Student / Parent", phone: "9999900001", role: "STUDENT" },
  { label: "Tutor", phone: "9999900002", role: "TUTOR" },
  { label: "Admin", phone: "9999900003", role: "STUDENT" },
];

interface ApiErrorBody {
  code: string;
  message: string;
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  /** Non-null only when the backend is running in dev mode. */
  const [devCode, setDevCode] = useState<string | null>(null);

  async function call(path: string, body: unknown): Promise<Response> {
    return fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Required so the browser stores the HttpOnly refresh cookie the backend sets.
      credentials: "include",
      body: JSON.stringify(body),
    });
  }

  async function requestCode(event: React.FormEvent, overridePhone?: string) {
    event.preventDefault();
    const target = overridePhone ?? phone;
    setBusy(true);
    setError(null);
    try {
      const res = await call("/auth/otp/request", { phone: target });
      const body = await res.json();
      if (!res.ok) {
        const err = body as ApiErrorBody;
        // Branch on `code`, never on `message` — messages get reworded.
        setError(
          err.code === "OTP_SEND_LIMIT_EXCEEDED"
            ? "Too many codes requested. Please try again in an hour."
            : err.message,
        );
        return;
      }
      // Present only when the backend is in dev mode. In any real deployment
      // this field is absent from the JSON entirely.
      if (typeof body.devCode === "string") {
        setCode(body.devCode);
        setDevCode(body.devCode);
      }
      setStep("code");
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  /** Fills a seeded test account and immediately requests its code. */
  function useTestAccount(
    event: React.MouseEvent,
    testPhone: string,
    testRole: Role,
  ) {
    setPhone(testPhone);
    setRole(testRole);
    void requestCode(event as unknown as React.FormEvent, testPhone);
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await call("/auth/otp/verify", { phone, code, role });
      const body = await res.json();
      if (!res.ok) {
        const err = body as ApiErrorBody;
        const friendly: Record<string, string> = {
          OTP_INVALID: "That code is not correct. Check and try again.",
          OTP_EXPIRED: "That code has expired. Request a new one.",
          OTP_ATTEMPTS_EXCEEDED:
            "Too many incorrect attempts. Please request a new code.",
        };
        setError(friendly[err.code] ?? err.message);
        return;
      }

      // Hand the token to the provider rather than holding it here. It lives in
      // memory only; a reload re-obtains one from the HttpOnly refresh cookie.
      signIn(body.accessToken, body.user);
      setSignedInAs(body.user.phone);

      // Straight to where they can actually do something. A tutor's next step is
      // their profile; a student's is posting a requirement.
      router.replace(
        body.user.role === "TUTOR" ? "/tutor/dashboard" : "/post-requirement",
      );
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------------------------------------------------- */

  if (signedInAs) {
    return (
      <Container className="flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-600">
            <Icon name="check" className="h-7 w-7" />
          </span>
          <h1 className="mt-6 text-2xl font-bold">You are signed in</h1>
          <p className="mt-2 text-ink-600">
            Signed in as <span className="font-semibold">{signedInAs}</span>
          </p>
          <p className="mt-6 text-sm text-ink-500">Taking you to your dashboard…</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"
          >
            Back to home
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-ink-200">
          <h1 className="text-2xl font-bold">
            {step === "phone" ? "Sign in or sign up" : "Enter your code"}
          </h1>
          <p className="mt-2 text-ink-600">
            {step === "phone"
              ? "We will send a 6-digit code to your mobile number."
              : `Sent to ${phone}.`}
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-600/20"
            >
              {error}
            </div>
          )}

          {step === "code" && devCode && (
            <div className="mt-5 rounded-lg bg-warning-50 px-4 py-3 text-sm text-ink-700 ring-1 ring-warning-600/20">
              <span className="font-semibold">Dev mode:</span> your code is{" "}
              <span className="font-mono text-base font-bold">{devCode}</span>
              <span className="mt-0.5 block text-xs text-ink-500">
                Filled in for you. This never appears in production.
              </span>
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={requestCode} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-ink-800"
                >
                  Mobile number
                </label>
                <div className="mt-1.5 flex items-center rounded-lg ring-1 ring-ink-300 focus-within:ring-2 focus-within:ring-brand-600">
                  <span className="pl-3.5 pr-2 text-ink-500">+91</span>
                  <input
                    id="phone"
                    name="phone"
                    // `tel` brings up the numeric keypad on a phone, which is
                    // most of this audience.
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="h-12 w-full rounded-r-lg bg-transparent pr-3.5 text-base focus:outline-none"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Sending…" : "Send code"}
              </Button>

              {/* Seeded test accounts. The backend only creates these when
                  apnatutor.dev.enabled is true, and DevModeGuard refuses to
                  start if that is set with a real SMS provider. */}
              <div className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Test accounts — no SMS needed
                </p>
                <div className="mt-3 space-y-1.5">
                  {TEST_ACCOUNTS.map((account) => (
                    <button
                      key={account.phone}
                      type="button"
                      disabled={busy}
                      onClick={(e) => useTestAccount(e, account.phone, account.role)}
                      className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2.5 text-left text-sm ring-1 ring-ink-200 transition-colors hover:bg-brand-50 hover:ring-brand-300 disabled:opacity-50"
                    >
                      <span className="font-medium text-ink-800">{account.label}</span>
                      <span className="font-mono text-xs text-ink-500">
                        {account.phone}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-500">
                  Code for all three: <span className="font-mono font-semibold">123456</span>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-ink-800"
                >
                  6-digit code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="mt-1.5 h-12 w-full rounded-lg text-center text-2xl font-semibold tracking-[0.4em] ring-1 ring-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-ink-800">
                  I am a…
                </legend>
                <p className="mt-0.5 text-xs text-ink-500">
                  Only used if this is a new account.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["STUDENT", "TUTOR"] as const).map((option) => (
                    <label
                      key={option}
                      className={`cursor-pointer rounded-lg px-4 py-3 text-center text-sm font-medium ring-1 transition-colors ${
                        role === option
                          ? "bg-brand-50 text-brand-700 ring-brand-400"
                          : "text-ink-600 ring-ink-200 hover:bg-ink-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option}
                        checked={role === option}
                        onChange={() => setRole(option)}
                        className="sr-only"
                      />
                      {option === "STUDENT" ? "Student / Parent" : "Tutor"}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Verifying…" : "Verify and continue"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                }}
                className="w-full text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Change number
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-500">
          In development the code is printed to the backend console instead of
          being sent by SMS.
        </p>
      </div>
    </Container>
  );
}
