import { fetchBackendHealth, type HealthStatus } from "@/lib/api";

// Rendered on every request so the health panel reflects reality rather than build time.
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<HealthStatus, string> = {
  UP: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  DOWN: "bg-red-100 text-red-800 ring-red-600/20",
  UNREACHABLE: "bg-amber-100 text-amber-800 ring-amber-600/20",
};

function StatusPill({ status }: { status: HealthStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function CheckRow({ label, status }: { label: string; status: HealthStatus }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 py-2.5 last:border-0">
      <span className="text-sm text-stone-600">{label}</span>
      <StatusPill status={status} />
    </div>
  );
}

/**
 * M0 placeholder. Its real job is the panel below: it proves the whole chain is wired — Next.js
 * reaches Spring Boot, which reaches PostgreSQL — before any feature work starts. The marketing
 * copy is scaffolding and gets replaced by the real landing page and search in M2.
 */
export default async function Home() {
  const health = await fetchBackendHealth();
  const frontendReachedBackend = health.status !== "UNREACHABLE";

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">
          Apna<span className="text-amber-600">Tutor</span>
        </h1>
        <p className="mt-2 text-lg text-stone-600">
          Apna tutor, apne ghar ke paas.
        </p>
        <p className="mt-4 max-w-xl text-stone-600">
          Post your tuition requirement for free. Verified home and online
          tutors near you get in touch.
        </p>
      </header>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            System check
          </h2>
          <span className="text-xs text-stone-400">M0 — Foundation</span>
        </div>

        <div className="mt-4">
          <CheckRow
            label="Frontend → Backend"
            status={frontendReachedBackend ? "UP" : "UNREACHABLE"}
          />
          <CheckRow label="Backend overall" status={health.status} />
          <CheckRow label="Backend → PostgreSQL" status={health.database} />
        </div>

        {health.status === "UNREACHABLE" && (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            Backend is not responding. Start it with{" "}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
              cd backend; .\mvnw.cmd spring-boot:run
            </code>
            {health.detail && (
              <span className="mt-1 block text-xs opacity-75">
                {health.detail}
              </span>
            )}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Next up
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          M1 — phone/OTP accounts, tutor profiles, and admin verification. See{" "}
          <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-xs">
            docs/PROGRESS.md
          </code>
          .
        </p>
      </section>
    </main>
  );
}
