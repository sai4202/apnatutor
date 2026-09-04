"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { Button, Card } from "@/components/ui";

/**
 * Export and deletion — M5-10.
 *
 * <h2>The deletion copy is the feature</h2>
 *
 * <p>Deletion here is irreversible, forfeits a tutor's unspent credits, and deliberately does
 * <em>not</em> remove the credit ledger or the reviews someone wrote. Every one of those is a
 * surprise if it is discovered afterwards, so all of them are on the screen before the button.
 * A confirmation dialog that says only "are you sure?" is not consent to any of it.
 *
 * <p>Export is offered first, and the delete panel points at it. Somebody leaving is exactly the
 * person who should be told they can take their data with them.
 */
export default function AccountDataPage() {
  const { user, loading, authFetch, signOut } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-ink-600">
        Please{" "}
        <a href="/login" className="font-medium text-brand-700 underline">
          sign in
        </a>{" "}
        to see your data.
      </p>
    );
  }

  async function downloadExport() {
    setExporting(true);
    setError(null);
    try {
      const res = await authFetch("/me/export");
      if (!res.ok) {
        setError("Could not build your export. Please try again.");
        return;
      }

      // Fetched with the bearer token and handed to the browser as a blob, for the same reason
      // the admin document viewer does it: the endpoint is authenticated, so a plain link cannot
      // reach it. The object URL is revoked immediately after the click.
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "apnatutor-data-export.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      const res = await authFetch("/me/delete", {
        method: "POST",
        body: JSON.stringify({ understood: true }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? "Could not delete your account.");
        return;
      }

      await signOut();
      router.replace("/");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setDeleting(false);
    }
  }

  const tutor = user.role === "TUTOR";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Your data</h1>
        <p className="mt-1 text-ink-600">
          Take a copy of everything we hold about you, or close your account for good.
        </p>
      </header>

      <ErrorBanner message={error} />

      <Card className="p-6">
        <h2 className="font-semibold text-ink-900">Download your data</h2>
        <p className="mt-1 text-sm text-ink-600">
          A JSON file with your account, profile,{" "}
          {tutor ? "credit ledger, payments and the leads you unlocked" : "enquiries and reviews"}.
          Contact details of other people are not included, even ones you paid to see — those
          belong to them.
        </p>
        <Button
          className="mt-4"
          variant="secondary"
          disabled={exporting}
          onClick={() => void downloadExport()}
        >
          {exporting ? "Preparing…" : "Download my data"}
        </Button>
      </Card>

      <Card className="p-6 ring-danger-600/20">
        <h2 className="font-semibold text-danger-700">Delete your account</h2>
        <p className="mt-1 text-sm text-ink-600">
          This cannot be undone. Download your data first if you want a copy.
        </p>

        <div className="mt-4 space-y-2 text-sm">
          <p className="font-medium text-ink-900">What is erased</p>
          <ul className="list-disc space-y-1 pl-5 text-ink-600">
            <li>Your phone number, email and profile</li>
            <li>Any identity or education documents you uploaded — the files are destroyed</li>
            <li>{tutor ? "Your listing, immediately, from search" : "Your open enquiries"}</li>
          </ul>

          <p className="pt-2 font-medium text-ink-900">What is kept, and why</p>
          <ul className="list-disc space-y-1 pl-5 text-ink-600">
            <li>
              Credit and payment records, without your details. They are financial records of
              money that moved, and removing them would break the accounts of people you dealt
              with.
            </li>
            <li>
              Reviews you wrote stay published. They are about a tutor, other parents have
              relied on them, and they never showed your full name.
            </li>
            {tutor && (
              <li className="text-danger-700">
                Any unspent credits are forfeited. Use them first if you can.
              </li>
            )}
          </ul>
        </div>

        <label className="mt-5 block text-sm font-medium text-ink-800" htmlFor="confirm">
          Type <span className="font-mono font-semibold">DELETE</span> to confirm
        </label>
        <input
          id="confirm"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          className="mt-1 h-10 w-40 rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-danger-600"
        />

        <Button
          className="mt-4"
          variant="danger"
          disabled={confirmText !== "DELETE" || deleting}
          onClick={() => void deleteAccount()}
        >
          {deleting ? "Deleting…" : "Delete my account permanently"}
        </Button>
      </Card>
    </div>
  );
}
