"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { PageHeader, Spinner } from "@/components/admin/Bits";
import { Badge, Button } from "@/components/ui";
import { rupees, type BandView, type PackageView, type SettingView } from "@/lib/admin";

/**
 * Pricing and platform settings — M5-06.2.
 *
 * <h2>What is safe to change here, and what is not</h2>
 *
 * <p>Everything on this screen takes effect on the <em>next</em> thing that happens, never on
 * something already in flight. A lead's price is locked onto the enquiry when it is posted, and a
 * payment copies its package's price at order time, so repricing a band or a pack cannot move the
 * cost of a lead a tutor is already looking at or rewrite what somebody paid last month. That is a
 * backend guarantee, and it is what makes this screen safe to hand to a non-engineer.
 *
 * <p>Retiring the last active package is refused by the API. An empty storefront is an outage, not
 * a pricing decision.
 */
export default function AdminPricingPage() {
  const { authFetch } = useAuth();
  const [packages, setPackages] = useState<PackageView[] | null>(null);
  const [bands, setBands] = useState<BandView[] | null>(null);
  const [settings, setSettings] = useState<SettingView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [packageRes, bandRes, settingRes] = await Promise.all([
        authFetch("/admin/packages"),
        authFetch("/admin/settings/pricing/bands"),
        authFetch("/admin/settings"),
      ]);

      if (!packageRes.ok || !bandRes.ok || !settingRes.ok) {
        setError("Could not load pricing.");
        return;
      }

      setError(null);
      setPackages((await packageRes.json()) as PackageView[]);
      setBands((await bandRes.json()) as BandView[]);
      setSettings((await settingRes.json()) as SettingView[]);
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

  async function send(path: string, method: string, body?: unknown) {
    const res = await authFetch(path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const failure = await res.json().catch(() => null);
      setError(failure?.message ?? "That change was refused.");
      return false;
    }

    setError(null);
    setNotice("Saved. It applies to the next enquiry or order, never to one already in flight.");
    await load();
    return true;
  }

  if (!packages || !bands || !settings) {
    return (
      <>
        <PageHeader title="Pricing" />
        <ErrorBanner message={error} />
        {!error && <Spinner />}
      </>
    );
  }

  const activePackages = packages.filter((entry) => entry.active).length;

  return (
    <>
      <PageHeader
        title="Pricing"
        description="Changes apply to the next enquiry posted and the next order placed. A lead already priced, and a payment already taken, are never rewritten."
      />

      <div className="space-y-6">
        <ErrorBanner message={error} />

        {notice && (
          <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200">
            {notice}
          </p>
        )}

        <section>
          <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Credit packs
          </h2>
          <ul className="space-y-2">
            {packages.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-ink-200/80"
              >
                <div>
                  <p className="font-semibold text-ink-900">
                    {entry.name}{" "}
                    {entry.highlighted && <Badge tone="brand">Highlighted</Badge>}
                    {!entry.active && <Badge tone="neutral">Retired</Badge>}
                  </p>
                  <p className="text-sm text-ink-600">
                    {entry.credits} credits for {rupees(entry.pricePaise)} ·{" "}
                    {rupees(entry.pricePerCreditPaise, true)} per credit
                  </p>
                </div>
                {entry.active ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={activePackages === 1}
                    title={
                      activePackages === 1
                        ? "The last active pack cannot be retired — an empty storefront is an outage"
                        : undefined
                    }
                    onClick={() => void send(`/admin/packages/${entry.id}`, "DELETE")}
                  >
                    Retire
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void send(`/admin/packages/${entry.id}/restore`, "POST")}
                  >
                    Restore
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="pb-1 text-sm font-semibold uppercase tracking-wide text-ink-500">
            What a lead costs
          </h2>
          <p className="pb-2 text-sm text-ink-600">
            Bands are matched on the student&apos;s stated budget: a bigger budget is a more
            valuable introduction, so it costs the tutor more credits.
          </p>
          <ul className="space-y-2">
            {bands.map((band) => (
              <BandRow
                key={band.id}
                band={band}
                onSave={(credits, label) =>
                  send(`/admin/settings/pricing/bands/${band.id}`, "PUT", { credits, label })
                }
              />
            ))}
          </ul>
        </section>

        <section>
          <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Platform settings
          </h2>
          <ul className="space-y-2">
            {settings.map((setting) => (
              <SettingRow
                key={setting.key}
                setting={setting}
                onSave={(value) =>
                  send(`/admin/settings/${setting.key}`, "PUT", { value })
                }
              />
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function BandRow({
  band,
  onSave,
}: {
  band: BandView;
  onSave: (credits: number, label: string) => Promise<boolean>;
}) {
  const [credits, setCredits] = useState(String(band.credits));
  const [label, setLabel] = useState(band.label);
  const dirty = credits !== String(band.credits) || label !== band.label;

  return (
    <li className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
      <div className="min-w-[8rem] flex-1">
        <p className="text-xs text-ink-500">Budget from</p>
        <p className="font-semibold tabular-nums text-ink-900">
          {rupees(band.minBudgetPaise)}
        </p>
      </div>
      <div>
        <label className="block text-xs text-ink-500" htmlFor={`band-credits-${band.id}`}>
          Credits
        </label>
        <input
          id={`band-credits-${band.id}`}
          inputMode="numeric"
          value={credits}
          onChange={(event) => setCredits(event.target.value)}
          className="mt-0.5 h-9 w-20 rounded-lg border-0 px-2.5 text-sm tabular-nums ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="min-w-[10rem] flex-1">
        <label className="block text-xs text-ink-500" htmlFor={`band-label-${band.id}`}>
          Label
        </label>
        <input
          id={`band-label-${band.id}`}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="mt-0.5 h-9 w-full rounded-lg border-0 px-2.5 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={!dirty || Number(credits) < 1}
        onClick={() => void onSave(Number(credits), label.trim())}
      >
        Save
      </Button>
    </li>
  );
}

function SettingRow({
  setting,
  onSave,
}: {
  setting: SettingView;
  onSave: (value: string) => Promise<boolean>;
}) {
  const [value, setValue] = useState(setting.value);

  return (
    <li className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-ink-200/80">
      <div className="min-w-[12rem] flex-1">
        <p className="font-mono text-sm font-medium text-ink-900">{setting.key}</p>
        {setting.description && (
          <p className="text-xs text-ink-500">{setting.description}</p>
        )}
      </div>
      <div>
        <label className="sr-only" htmlFor={`setting-${setting.key}`}>
          {setting.key}
        </label>
        <input
          id={`setting-${setting.key}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-9 w-28 rounded-lg border-0 px-2.5 text-sm tabular-nums ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
        />
        {(setting.minValue !== null || setting.maxValue !== null) && (
          <p className="mt-0.5 text-xs text-ink-400">
            {setting.minValue ?? "—"} to {setting.maxValue ?? "—"}
          </p>
        )}
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={value === setting.value}
        onClick={() => void onSave(value.trim())}
      >
        Save
      </Button>
    </li>
  );
}
