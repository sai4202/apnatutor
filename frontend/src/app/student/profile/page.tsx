"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import { ErrorBanner } from "@/components/RequireRole";
import { Button, Container, Icon } from "@/components/ui";

/**
 * The parent's own details.
 *
 * <h2>Why this page is so short</h2>
 *
 * <p>Two fields, both optional. A student profile exists so a tutor sees a name
 * rather than "Student" after paying to unlock a lead, and so the site can
 * default a city on the post-requirement form. It is not an identity a parent
 * has to build, and every extra field here is one more reason to abandon the
 * page — the enquiry is what matters, not the profile behind it.
 *
 * <p>The phone number is shown but not editable. It is the login identity and
 * changing it would mean re-verifying by OTP, which belongs in an account
 * settings flow rather than here.
 */

interface Profile {
  id: number;
  name: string | null;
  locationId: number | null;
  locationName: string | null;
}

interface City {
  id: number;
  name: string;
  state: string;
}

export default function StudentProfilePage() {
  const { authFetch, user, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [profileRes, cityRes] = await Promise.all([
        authFetch("/student/profile"),
        // Public catalog, so a plain fetch rather than an authenticated one.
        fetch(`${API_BASE_URL}/public/catalog/cities`),
      ]);

      if (profileRes.ok) {
        const body: Profile = await profileRes.json();
        setProfile(body);
        setName(body.name ?? "");
        setLocationId(body.locationId ? String(body.locationId) : "");
      } else {
        setError("Could not load your details.");
      }
      if (cityRes.ok) setCities(await cityRes.json());
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch]);

  useEffect(() => {
    // Awaited inside the effect rather than a bare `void load()`. React's
    // set-state-in-effect rule cannot see that the writes happen after an
    // await otherwise, and reports a cascading render that is not there.
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await authFetch("/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          locationId: locationId ? Number(locationId) : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.message ?? "Could not save your details.");
        return;
      }
      setProfile(await res.json());
      setSaved(true);
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

  return (
    <Container className="py-6 sm:py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">My details</h1>
              <p className="mt-1 text-ink-600">
                Both optional. Tutors see your name only after they have paid to
                respond to one of your enquiries.
              </p>
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

        <form
          onSubmit={save}
          className="panel space-y-5 bg-white p-6 ring-1 ring-ink-200/70 sm:p-8"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink-800">
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="Priya Sharma"
              className="mt-1.5 h-12 w-full rounded-lg bg-white px-3.5 ring-1 ring-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            <p className="mt-1.5 text-xs text-ink-500">
              A tutor who has responded sees this instead of &ldquo;Student&rdquo;.
            </p>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-ink-800">
              City
            </label>
            <select
              id="city"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-lg bg-white px-3 ring-1 ring-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Not set</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.state}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-ink-500">
              Used to pre-fill the location when you post an enquiry.
            </p>
          </div>

          {/* Read-only: this is the login identity, and changing it means
              re-verifying by OTP — an account-settings flow, not this page. */}
          <div>
            <span className="block text-sm font-medium text-ink-800">
              Mobile number
            </span>
            <p className="mt-1.5 flex h-12 items-center rounded-lg bg-ink-50 px-3.5 font-medium text-ink-600 ring-1 ring-ink-200">
              {user?.phone}
            </p>
            <p className="mt-1.5 text-xs text-ink-500">
              This is how you sign in, so it cannot be changed here.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-700">
                <Icon name="check" className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        </form>
      </div>
    </Container>
  );
}
