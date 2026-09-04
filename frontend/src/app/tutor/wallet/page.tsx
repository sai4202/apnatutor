"use client";

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import { useAuth } from "@/lib/auth";
import { ErrorBanner } from "@/components/RequireRole";
import { Badge, Button, Container, Icon } from "@/components/ui";

/**
 * The tutor's wallet: balance, packages, purchase history, disputes.
 *
 * <h2>Why the pending state gets first-class treatment</h2>
 *
 * <p>A UPI payment can take a while, and Razorpay's browser callback is not what
 * credits the wallet — the signed webhook is. So there is a real window where the
 * money has left the tutor's account and the credits have not arrived, and it is
 * the state most checkout screens forget. Showing a spinner that never resolves,
 * or worse an error, turns a working payment into a support ticket.
 */

interface Package {
  id: number;
  name: string;
  credits: number;
  pricePaise: number;
  pricePerCreditPaise: number;
  highlighted: boolean;
}

interface LedgerEntry {
  id: number;
  amount: number;
  reason: string;
  balanceAfter: number;
  expiresAt: string | null;
  at: string;
}

interface PaymentRow {
  id: number;
  providerOrderId: string;
  credits: number;
  amountPaise: number;
  status: "CREATED" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  creditedAt: string | null;
}

interface Wallet {
  balance: number;
  expiringSoon: number;
  history: LedgerEntry[];
  payments: PaymentRow[];
}

interface Receipt {
  paymentId: number;
  receiptNumber: string;
  issuedAt: string;
  tutorName: string;
  tutorPhone: string;
  packageName: string;
  credits: number;
  amountPaise: number;
  gstin: string | null;
  taxPaise: number | null;
  providerPaymentId: string;
  status: string;
}

interface Order {
  paymentId: number;
  providerOrderId: string;
  provider: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  credits: number;
  packageName: string;
}

/** Razorpay's checkout widget, injected by their script. */
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const REASON_LABELS: Record<string, string> = {
  PURCHASE: "Credits purchased",
  SIGNUP_BONUS: "Verification bonus",
  UNLOCK: "Enquiry unlocked",
  REFUND: "Dispute refunded",
  ADMIN_ADJUSTMENT: "Adjustment",
  EXPIRY: "Credits expired",
};

function rupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WalletPage() {
  const { authFetch } = useAuth();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [busyPackageId, setBusyPackageId] = useState<number | null>(null);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  async function openReceipt(paymentId: number) {
    setError(null);
    try {
      const res = await authFetch(`/tutor/wallet/payments/${paymentId}/receipt`);
      if (!res.ok) {
        setError("That receipt is not available yet.");
        return;
      }
      setReceipt(await res.json());
    } catch {
      setError("Could not reach the server.");
    }
  }

  /** Returns the wallet it loaded, so callers can inspect it without a stale closure. */
  const load = useCallback(async (): Promise<Wallet | null> => {
    try {
      const [walletRes, packageRes] = await Promise.all([
        authFetch("/tutor/wallet"),
        authFetch("/tutor/wallet/packages"),
      ]);
      if (packageRes.ok) setPackages(await packageRes.json());

      if (!walletRes.ok) {
        setError("Could not load your wallet.");
        return null;
      }

      const loaded: Wallet = await walletRes.json();
      setWallet(loaded);
      return loaded;
    } catch {
      setError("Could not reach the server.");
      return null;
    }
  }, [authFetch]);

  useEffect(() => {
    // See the note in student/profile: awaiting inside the effect is what lets
    // React's set-state-in-effect rule see that the writes are post-await.
    async function run() {
      await load();
    }
    void run();
  }, [load]);

  async function buy(chosen: Package) {
    setBusyPackageId(chosen.id);
    setError(null);
    try {
      const res = await authFetch("/tutor/wallet/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: chosen.id }),
      });
      const body = await res.json();

      if (!res.ok) {
        // Branch on the code, never the message.
        setError(
          body.code === "PAYMENT_GATEWAY_ERROR"
            ? "We could not reach the payment provider. Please try again in a moment."
            : (body.message ?? "Could not start the payment."),
        );
        return;
      }

      const order: Order = body;

      // No Razorpay account configured yet: the backend used its stub gateway,
      // so there is no widget to open. Say so plainly rather than opening
      // something that will not work.
      if (order.provider !== "RAZORPAY" || !order.keyId) {
        setPendingOrder(order);
        setError(
          "Payments are not connected yet. The order was created, but there is " +
            "no checkout to complete — add Razorpay keys to enable it.",
        );
        return;
      }

      openCheckout(order);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusyPackageId(null);
    }
  }

  function openCheckout(order: Order) {
    if (!window.Razorpay) {
      setError("The payment window could not load. Check your connection and try again.");
      return;
    }

    const checkout = new window.Razorpay({
      key: order.keyId,
      // From the server's order, not recomputed here. A client-chosen amount
      // would be the entire vulnerability.
      amount: order.amountPaise,
      currency: order.currency,
      name: "ApnaTutor",
      description: `${order.credits} credits — ${order.packageName}`,
      order_id: order.providerOrderId,
      handler: (response: Record<string, string>) => {
        void confirm(order, response);
      },
      modal: {
        // Not an error. Closing the window is a decision, not a failure, and
        // the order is cleaned up by the server after a couple of hours.
        ondismiss: () => setPendingOrder(null),
      },
      theme: { color: "#2563eb" },
    });

    setPendingOrder(order);
    checkout.open();
  }

  /**
   * Reports the checkout result and then polls for the credits.
   *
   * The credits arrive via the signed webhook, not this call, so the honest
   * thing to do is wait briefly and show what actually happened rather than
   * claiming success on the strength of a browser callback.
   */
  async function confirm(order: Order, response: Record<string, string>) {
    try {
      await authFetch("/tutor/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id ?? order.providerOrderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });
    } catch {
      // The verify call is advisory. Failing it changes nothing about whether
      // the payment succeeded, so it must not surface as an error.
    }

    // Six tries over roughly twelve seconds. Long enough for a webhook on a
    // normal day, short enough not to look frozen; after that the history
    // below shows the payment as awaiting confirmation, which is the truth.
    //
    // The returned wallet is inspected rather than the `wallet` state, which
    // would be the value captured when this function was created.
    for (let attempt = 0; attempt < 6; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const latest = await load();
      const credited = latest?.payments.find(
        (payment) => payment.providerOrderId === order.providerOrderId,
      );
      if (credited?.status === "PAID") break;
    }

    setPendingOrder(null);
  }

  if (!wallet) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
      </Container>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
        strategy="lazyOnload"
      />

      <Container className="py-6 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-5">
          <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Wallet</h1>
                <p className="mt-1 text-ink-600">
                  Credits are what you spend to see a parent&apos;s contact details.
                </p>
              </div>
              <div className="rounded-2xl bg-brand-50 px-7 py-4 text-center ring-1 ring-brand-200">
                <p className="text-4xl font-bold text-brand-700">{wallet.balance}</p>
                <p className="text-xs text-brand-900/70">credits</p>
              </div>
            </div>

            {wallet.expiringSoon > 0 && (
              /* Sent while there is still time to use them. Discovering the
                 loss afterwards reads as the platform taking something. */
              <p className="mt-5 rounded-xl bg-warning-50 px-4 py-3 text-sm text-ink-700 ring-1 ring-warning-600/20">
                <strong>{wallet.expiringSoon} credits</strong> expire within 30
                days. Unlocking an enquiry uses the oldest ones first.
              </p>
            )}
          </section>

          <ErrorBanner message={error} />

          {pendingOrder && (
            <section className="panel bg-brand-50 p-6 ring-1 ring-brand-200">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
                <div>
                  <h2 className="font-bold text-ink-900">Payment in progress</h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    {pendingOrder.credits} credits for {rupees(pendingOrder.amountPaise)}.
                    Credits land as soon as your bank confirms — usually seconds,
                    occasionally a minute or two. You can leave this page; nothing
                    is lost.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
            <h2 className="text-lg font-bold">Buy credits</h2>
            <p className="mt-1.5 text-sm text-ink-600">
              Larger packages cost less per credit. Credits last a year.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {packages.map((option) => (
                <div
                  key={option.id}
                  className={`relative rounded-2xl p-5 ring-1 ${
                    option.highlighted
                      ? "bg-brand-50 ring-brand-300"
                      : "bg-ink-50 ring-ink-200"
                  }`}
                >
                  {option.highlighted && (
                    <span className="absolute -top-2.5 right-4">
                      <Badge tone="brand">Most popular</Badge>
                    </span>
                  )}

                  <p className="font-semibold text-ink-900">{option.name}</p>
                  <p className="mt-2 text-3xl font-bold text-ink-900">
                    {option.credits}
                    <span className="ml-1.5 text-base font-normal text-ink-500">
                      credits
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-ink-600">
                    {rupees(option.pricePaise)} ·{" "}
                    {(option.pricePerCreditPaise / 100).toFixed(2)} per credit
                  </p>

                  <Button
                    className="mt-4 w-full"
                    variant={option.highlighted ? "primary" : "secondary"}
                    disabled={busyPackageId !== null || !scriptReady}
                    onClick={() => void buy(option)}
                  >
                    {busyPackageId === option.id ? "Starting…" : "Buy"}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
            <h2 className="text-lg font-bold">Purchases</h2>

            {wallet.payments.length === 0 ? (
              <p className="mt-2 text-sm text-ink-600">No purchases yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-ink-100">
                {wallet.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink-900">
                        {payment.credits} credits
                      </p>
                      <p className="text-sm text-ink-500">
                        {formatDate(payment.createdAt)} ·{" "}
                        {rupees(payment.amountPaise)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <PaymentBadge status={payment.status} />
                      {payment.status === "PAID" && (
                        <button
                          type="button"
                          onClick={() => void openReceipt(payment.id)}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          Receipt
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {receipt && (
            <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />
          )}

          <section className="panel bg-white p-6 ring-1 ring-ink-200/70 sm:p-8">
            <h2 className="text-lg font-bold">Credit history</h2>

            {wallet.history.length === 0 ? (
              <p className="mt-2 text-sm text-ink-600">Nothing yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-ink-100">
                {wallet.history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink-900">
                        {REASON_LABELS[entry.reason] ?? entry.reason}
                      </p>
                      <p className="text-sm text-ink-500">{formatDate(entry.at)}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          entry.amount > 0 ? "text-success-700" : "text-ink-700"
                        }`}
                      >
                        {entry.amount > 0 ? "+" : ""}
                        {entry.amount}
                      </p>
                      {/* The running balance. Without it a list of movements is
                          not something anyone can check against their own. */}
                      <p className="text-xs text-ink-500">
                        balance {entry.balanceAfter}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}

/**
 * A printable receipt.
 *
 * The browser does the printing — `window.print()` on a page whose other
 * content is hidden by the `print:hidden` utilities. No PDF library, no server
 * rendering, no font that looks wrong on someone else's machine, and the reader
 * gets to choose "save as PDF" from a dialog they already know.
 */
function ReceiptDialog({
  receipt,
  onClose,
}: {
  receipt: Receipt;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 print:static print:bg-white print:p-0">
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg print:my-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-bold">
              <span className="text-ink-900">Apna</span>
              <span className="text-brand-600">Tutor</span>
            </p>
            <p className="mt-0.5 text-sm text-ink-500">Receipt</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-semibold text-ink-900">
              {receipt.receiptNumber}
            </p>
            <p className="text-ink-500">
              {new Date(receipt.issuedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-ink-200 pt-4 text-sm">
          <p className="text-ink-500">Billed to</p>
          <p className="mt-0.5 font-medium text-ink-900">{receipt.tutorName}</p>
          <p className="text-ink-600">{receipt.tutorPhone}</p>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-ink-500">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3">
                <p className="font-medium text-ink-900">{receipt.packageName}</p>
                <p className="text-ink-500">{receipt.credits} credits</p>
              </td>
              <td className="py-3 text-right text-ink-900">
                {rupees(receipt.amountPaise)}
              </td>
            </tr>
            {receipt.taxPaise != null && (
              <tr>
                <td className="py-2 text-ink-600">GST</td>
                <td className="py-2 text-right text-ink-900">
                  {rupees(receipt.taxPaise)}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-ink-200">
              <td className="pt-3 font-semibold text-ink-900">Total paid</td>
              <td className="pt-3 text-right text-lg font-bold text-ink-900">
                {rupees(receipt.amountPaise + (receipt.taxPaise ?? 0))}
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-6 border-t border-ink-200 pt-4 text-xs text-ink-500">
          <p>Payment reference: {receipt.providerPaymentId}</p>
          {receipt.gstin && <p className="mt-0.5">GSTIN: {receipt.gstin}</p>}
          <p className="mt-2">
            Credits are used to contact students on ApnaTutor. They are not
            tuition fees — ApnaTutor never handles payments between a student and
            a tutor.
          </p>
        </div>

        <div className="mt-6 flex gap-3 print:hidden">
          <Button className="flex-1" onClick={() => window.print()}>
            Print or save as PDF
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status: PaymentRow["status"] }) {
  switch (status) {
    case "PAID":
      return (
        <Badge tone="success">
          <Icon name="check" className="h-3.5 w-3.5" />
          Credited
        </Badge>
      );
    case "CREATED":
      // The state everyone forgets. It is not a failure, and calling it one
      // sends a tutor whose money is fine straight to support.
      return <Badge tone="warning">Awaiting confirmation</Badge>;
    case "REFUNDED":
      return <Badge tone="neutral">Refunded</Badge>;
    default:
      return <Badge tone="neutral">{status.toLowerCase()}</Badge>;
  }
}
