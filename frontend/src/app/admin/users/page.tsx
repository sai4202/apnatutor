"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { EmptyQueue, PageHeader, ReasonAction, Spinner } from "@/components/admin/Bits";
import { Badge, Button } from "@/components/ui";
import {
  dateTime,
  shortDate,
  type Page,
  type UserDetail,
  type UserRole,
  type UserRow,
  type UserStatus,
} from "@/lib/admin";

/**
 * User management — M5-05.3 / M5-06.2.
 *
 * <h2>Suspending is not a button, it is a decision</h2>
 *
 * <p>The row does not carry a suspend action. Opening the account first is deliberate: the detail
 * panel is where the counts live, and "suspend this tutor" means something entirely different for
 * one who has bought two leads than for one who has bought two hundred and disputed most of them.
 * A suspend button in a list invites acting on a phone number alone.
 *
 * <p>The screen also reports the blast radius afterwards. Suspending a student takes down their
 * live enquiries and refunds the tutors who paid for them, and an admin who is not told that
 * happened will not know to expect the support calls.
 */

const ROLES: UserRole[] = ["STUDENT", "TUTOR", "ADMIN"];
const STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "DELETED"];

export default function AdminUsersPage() {
  const { authFetch } = useAuth();

  const [role, setRole] = useState<UserRole | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<Page<UserRow> | null>(null);
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const query = new URLSearchParams();
    if (role) query.set("role", role);
    if (status) query.set("status", status);
    if (phone.trim()) query.set("phone", phone.trim());

    try {
      const res = await authFetch(`/admin/users?${query}`);
      if (!res.ok) {
        setError("Could not load accounts.");
        return;
      }
      setError(null);
      setRows((await res.json()) as Page<UserRow>);
    } catch {
      setError("Could not reach the server.");
    }
  }, [authFetch, role, status, phone]);

  useEffect(() => {
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function open(id: number) {
    setNotice(null);
    const res = await authFetch(`/admin/users/${id}`);
    if (res.ok) setSelected((await res.json()) as UserDetail);
    else setError("Could not load that account.");
  }

  async function suspend(id: number, reason: string) {
    const res = await authFetch(`/admin/users/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Could not suspend that account.");
      return;
    }

    const outcome = (await res.json()) as { user: UserDetail; enquiriesRemoved: number };
    setSelected(outcome.user);
    setNotice(
      outcome.enquiriesRemoved > 0
        ? `Suspended. ${outcome.enquiriesRemoved} live ${
            outcome.enquiriesRemoved === 1 ? "enquiry was" : "enquiries were"
          } taken down and the tutors who had paid for them were refunded.`
        : "Suspended.",
    );
    await load();
  }

  async function reinstate(id: number) {
    const res = await authFetch(`/admin/users/${id}/reinstate`, { method: "POST" });
    if (!res.ok) {
      setError("Could not reinstate that account.");
      return;
    }
    setSelected((await res.json()) as UserDetail);
    setNotice("Reinstated. Enquiries removed by the suspension are not restored.");
    await load();
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Phone matches on any fragment — the last few digits a caller reads out are enough."
      />

      <div className="space-y-4">
        <ErrorBanner message={error} />

        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-3 ring-1 ring-ink-200/80">
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone, any part"
            aria-label="Search by phone number"
            className="h-9 min-w-[10rem] flex-1 rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole | "")}
            aria-label="Filter by role"
            className="h-9 rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Any role</option>
            {ROLES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as UserStatus | "")}
            aria-label="Filter by status"
            className="h-9 rounded-lg border-0 px-3 text-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Any status</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0) + value.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <AccountPanel
            detail={selected}
            notice={notice}
            onClose={() => setSelected(null)}
            onSuspend={(reason) => suspend(selected.account.id, reason)}
            onReinstate={() => reinstate(selected.account.id)}
          />
        )}

        {!rows ? (
          <Spinner />
        ) : rows.content.length === 0 ? (
          <EmptyQueue>No accounts match those filters.</EmptyQueue>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-ink-200/80">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Joined</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.content.map((row) => (
                  <tr key={row.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium tabular-nums text-ink-900">
                      {row.phone}
                      {row.email && (
                        <span className="block text-xs font-normal text-ink-500">
                          {row.email}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-ink-600">
                      {row.role.charAt(0) + row.role.slice(1).toLowerCase()}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.status === "ACTIVE" ? (
                        <Badge tone="success">Active</Badge>
                      ) : row.status === "SUSPENDED" ? (
                        <Badge tone="warning">Suspended</Badge>
                      ) : (
                        <Badge tone="neutral">Deleted</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-ink-500">
                      {shortDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button size="sm" variant="secondary" onClick={() => open(row.id)}>
                        Open
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-2.5 text-xs text-ink-500">
              {rows.totalElements.toLocaleString("en-IN")} matching{" "}
              {rows.totalElements === 1 ? "account" : "accounts"}
              {rows.totalPages > 1 && `, showing the first ${rows.content.length}`}
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The opened account.
 *
 * <p>The counts come first and the action last, in that order on purpose. This panel exists so the
 * decision is made on evidence rather than on a phone number, and putting the destructive button
 * above the evidence would defeat the point of having it.
 */
function AccountPanel({
  detail,
  notice,
  onClose,
  onSuspend,
  onReinstate,
}: {
  detail: UserDetail;
  notice: string | null;
  onClose: () => void;
  onSuspend: (reason: string) => Promise<void>;
  onReinstate: () => Promise<void>;
}) {
  const { account } = detail;
  const tutor = account.role === "TUTOR";
  const student = account.role === "STUDENT";

  return (
    <section className="rounded-xl bg-white p-5 ring-1 ring-brand-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tabular-nums text-ink-900">{account.phone}</h2>
          <p className="text-sm text-ink-600">
            {account.role.charAt(0) + account.role.slice(1).toLowerCase()} · joined{" "}
            {shortDate(account.createdAt)} · last seen {dateTime(account.lastActiveAt)}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      {account.status === "SUSPENDED" && (
        <div className="mt-3 rounded-lg bg-warning-50 px-3 py-2.5 text-sm text-warning-600 ring-1 ring-warning-600/20">
          <span className="font-semibold">Suspended {shortDate(account.suspendedAt)}</span>
          {account.suspensionReason && <> — {account.suspensionReason}</>}
          {detail.suspendedBy && (
            <span className="block text-xs opacity-80">by admin #{detail.suspendedBy}</span>
          )}
        </div>
      )}

      {notice && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-800 ring-1 ring-brand-200">
          {notice}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tutor && (
          <>
            <Fact label="Wallet" value={`${detail.walletBalance ?? 0} credits`} />
            <Fact label="Leads held" value={String(detail.leadsHeld ?? 0)} />
            <Fact label="Disputes raised" value={String(detail.disputesRaised ?? 0)} />
          </>
        )}
        {student && (
          <>
            <Fact label="Enquiries posted" value={String(detail.enquiriesPosted ?? 0)} />
            <Fact label="Live now" value={String(detail.enquiriesLive ?? 0)} />
            <Fact label="Removed as spam" value={String(detail.enquiriesRemoved ?? 0)} />
          </>
        )}
      </dl>

      <div className="mt-4 border-t border-ink-100 pt-4">
        {account.role === "ADMIN" ? (
          <p className="text-sm text-ink-500">
            Admin accounts cannot be suspended here. Suspending the last admin would lock
            everyone out of the console with no way back in through the product.
          </p>
        ) : account.status === "SUSPENDED" ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => void onReinstate()}>
              Reinstate
            </Button>
            <p className="text-xs text-ink-500">
              Enquiries removed by the suspension stay removed — their tutors have been
              refunded and told the enquiry was gone.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <ReasonAction
              label="Suspend account"
              title="Why is this account being suspended?"
              placeholder="Shown to the user at sign-in, and to whoever reviews the appeal"
              onConfirm={onSuspend}
            />
            {/* Debt T15. Access tokens are stateless and last 15 minutes, so search and the
                profile page close immediately but the user's own open session does not. Saying
                so is the difference between an admin who waits and one who reports a bug. */}
            <p className="text-xs text-ink-500">
              Search and their profile page close immediately. Their own signed-in session
              can last up to 15 more minutes.
            </p>
            {student && (detail.enquiriesLive ?? 0) > 0 && (
              <p className="text-xs text-warning-600">
                This will also take down {detail.enquiriesLive} live{" "}
                {detail.enquiriesLive === 1 ? "enquiry" : "enquiries"} and refund every tutor
                who paid to reach them.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-50 px-3 py-2">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums text-ink-900">{value}</dd>
    </div>
  );
}
