"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { EmptyQueue, PageHeader, Spinner, StatTile } from "@/components/admin/Bits";
import { percent, rupees, type Dashboard } from "@/lib/admin";

/**
 * The dashboard — M5-06.4.
 *
 * <h2>Every rate shows its denominator</h2>
 *
 * <p>The API returns each conversion as a numerator and a total rather than a percentage, and this
 * screen prints both. On a platform this young the honest reading of "12%" is usually "3 of 25",
 * and a dashboard that hides that teaches whoever reads it to trust a number that moves by four
 * points when one tutor signs up.
 *
 * <p>The chart is an inline SVG. Four series over four weeks does not justify a charting library,
 * and a dependency here would be loaded by nobody but the two people who use this screen.
 */
export default function AdminDashboardPage() {
  const { authFetch } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/admin/metrics?windowDays=28");
      if (!res.ok) {
        setError("Could not load the dashboard.");
        return;
      }
      setData((await res.json()) as Dashboard);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch]);

  useEffect(() => {
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  if (error) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorBanner message={error} />
      </>
    );
  }

  if (!data) return <Spinner />;

  const { accounts, requirements, leads, revenue } = data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Totals are all-time. The chart covers the last ${data.windowDays} days, bucketed by Indian Standard Time.`}
      />

      <div className="space-y-6">
        <Section title="Money">
          <StatTile
            label="Gross revenue"
            value={rupees(revenue.grossPaise)}
            hint={`${revenue.paidOrders} paid ${revenue.paidOrders === 1 ? "order" : "orders"}`}
            tone="good"
          />
          <StatTile
            label="Checkout abandoned"
            value={percent(revenue.abandoned)}
            hint={`${revenue.abandoned.of} of ${revenue.abandoned.total} started`}
            tone={revenue.abandoned.of > revenue.abandoned.total / 2 ? "warn" : "neutral"}
          />
          <StatTile
            label="Credits spent on leads"
            value={leads.creditsSpent.toLocaleString("en-IN")}
            hint={`across ${leads.unlocks} unlocks`}
          />
          <StatTile
            label="Signup bonus given"
            value={revenue.bonusCreditsGranted.toLocaleString("en-IN")}
            hint="credits granted, not sold"
          />
        </Section>

        <Section title="Tutors">
          <StatTile label="Tutor accounts" value={accounts.tutors.toLocaleString("en-IN")} />
          <StatTile
            label="Profile published"
            value={percent(accounts.published)}
            hint={`${accounts.published.of} of ${accounts.published.total}`}
          />
          <StatTile
            label="ID verified"
            value={percent(accounts.idVerified)}
            hint={`${accounts.idVerified.of} of ${accounts.idVerified.total}`}
          />
          <StatTile
            label="Ever bought credits"
            value={percent(accounts.everPurchased)}
            hint={`${accounts.everPurchased.of} of ${accounts.everPurchased.total}`}
            tone="good"
          />
        </Section>

        <Section title="Students and enquiries">
          <StatTile label="Student accounts" value={accounts.students.toLocaleString("en-IN")} />
          <StatTile
            label="Enquiries answered"
            value={percent(requirements.answered)}
            hint={`${requirements.answered.of} of ${requirements.answered.total} — the number that decides whether students come back`}
            tone="good"
          />
          <StatTile
            label="Live now"
            value={requirements.live.toLocaleString("en-IN")}
            hint={`${percent(requirements.filled)} of all enquiries filled every slot`}
          />
          <StatTile
            label="Removed as spam"
            value={requirements.removed.toLocaleString("en-IN")}
            tone={requirements.removed > 0 ? "warn" : "neutral"}
          />
        </Section>

        <Section title="Lead quality">
          <StatTile
            label="Leads disputed"
            value={percent(leads.disputed)}
            hint={`${leads.disputed.of} of ${leads.disputed.total} unlocks`}
            tone={leads.disputed.total > 0 && leads.disputed.of / leads.disputed.total > 0.15 ? "warn" : "neutral"}
          />
          <StatTile
            label="Disputes upheld"
            value={percent(leads.disputesUpheld)}
            hint={`${leads.disputesUpheld.of} of ${leads.disputesUpheld.total} decided our way`}
          />
          <StatTile label="Suspended accounts" value={accounts.suspended.toLocaleString("en-IN")} />
        </Section>

        <Trend data={data} />
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

/**
 * Daily activity, as bars.
 *
 * <p>Counts and revenue share an x-axis but not a y-axis — a day with ₹4,000 and 3 signups cannot
 * be drawn on one scale without one of them being invisible. Each series is scaled to its own
 * maximum, which is honest about shape and says nothing about relative size; the numbers above
 * carry the magnitudes.
 *
 * <p>Days with no activity are drawn as zero-height bars rather than skipped. The backend fills
 * them in for exactly this reason: a chart that omits empty days draws a straight line through a
 * dead week and makes an outage look like steady trade.
 */
function Trend({ data }: { data: Dashboard }) {
  const series = [
    { key: "signups" as const, label: "Signups", colour: "fill-brand-500" },
    { key: "requirements" as const, label: "Enquiries", colour: "fill-success-600" },
    { key: "unlocks" as const, label: "Unlocks", colour: "fill-warning-500" },
  ];

  const revenueMax = Math.max(...data.daily.map((d) => d.revenuePaise), 1);

  if (data.daily.length === 0) {
    return <EmptyQueue>No activity recorded yet.</EmptyQueue>;
  }

  return (
    <section>
      <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
        Last {data.windowDays} days
      </h2>

      <div className="space-y-3 overflow-x-auto rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
        {series.map((s) => {
          const max = Math.max(...data.daily.map((d) => d[s.key]), 1);
          const total = data.daily.reduce((sum, d) => sum + d[s.key], 0);

          return (
            <div key={s.key}>
              <div className="flex items-baseline justify-between pb-1 text-xs">
                <span className="font-medium text-ink-700">{s.label}</span>
                <span className="tabular-nums text-ink-500">
                  {total.toLocaleString("en-IN")} in the window · peak {max}
                </span>
              </div>
              <svg
                viewBox={`0 0 ${data.daily.length * 4} 24`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`${s.label}: ${total} over ${data.daily.length} days`}
                className="h-12 w-full min-w-[20rem]"
              >
                {data.daily.map((day, index) => {
                  const height = (day[s.key] / max) * 22;
                  return (
                    <rect
                      key={day.day}
                      x={index * 4}
                      y={24 - height}
                      width={3}
                      height={height}
                      rx={0.5}
                      className={s.colour}
                    >
                      <title>{`${day.day}: ${day[s.key]}`}</title>
                    </rect>
                  );
                })}
              </svg>
            </div>
          );
        })}

        <div>
          <div className="flex items-baseline justify-between pb-1 text-xs">
            <span className="font-medium text-ink-700">Revenue</span>
            <span className="tabular-nums text-ink-500">
              peak {rupees(revenueMax)} in a day
            </span>
          </div>
          <svg
            viewBox={`0 0 ${data.daily.length * 4} 24`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Daily revenue"
            className="h-12 w-full min-w-[20rem]"
          >
            {data.daily.map((day, index) => {
              const height = (day.revenuePaise / revenueMax) * 22;
              return (
                <rect
                  key={day.day}
                  x={index * 4}
                  y={24 - height}
                  width={3}
                  height={height}
                  rx={0.5}
                  className="fill-ink-800"
                >
                  <title>{`${day.day}: ${rupees(day.revenuePaise)}`}</title>
                </rect>
              );
            })}
          </svg>
        </div>

        <p className="pt-1 text-xs text-ink-500">
          Each series is scaled to its own peak, so the shapes are comparable but the
          heights are not.
        </p>
      </div>
    </section>
  );
}
