import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund policy",
  description:
    "When credits are refunded on ApnaTutor, how to raise a dispute, and what happens to your money.",
  alternates: { canonical: "/refund-policy" },
};

/**
 * Refund policy — M6-09.3.
 *
 * <p><strong>This page must match SOURCE_OF_TRUTH.md §3.5 exactly.</strong> It is the one legal
 * page that describes behaviour the code actually enforces, line for line: the seven-day window,
 * the fixed reason codes, one dispute per lead, the freed cap slot, refunded credits carrying no
 * expiry. A policy that promises something the software does not do is worse than no policy —
 * it is a commitment made to every tutor who reads it.
 *
 * <p>If §3.5 changes, this changes in the same commit.
 */
export default function RefundPolicyPage() {
  return (
    <>
      <h1>Refund policy</h1>
      <p className="text-ink-500">Last updated 4 September 2026</p>

      <p>
        This policy covers <strong>credits</strong> — the currency tutors use to unlock a
        student&apos;s contact details. Students never pay ApnaTutor anything, so nothing here
        applies to them.
      </p>

      <h2>What you are buying</h2>
      <p>
        A credit buys one introduction: the name and phone number of a student who has posted an
        enquiry. It does not buy a lesson, a reply, or a booking. Whether the student answers, and
        whether they go on to hire you, is between the two of you.
      </p>
      <p>
        The price of an enquiry in credits is fixed when the student posts it and shown to you
        before you unlock. It never changes afterwards, even if we change our pricing in between.
      </p>

      <h2>When we refund</h2>
      <p>
        If an introduction turns out to be worthless, we return the credits. You can raise a
        dispute <strong>within 7 days</strong> of unlocking a lead. We ask for a reason from this
        list:
      </p>
      <ul>
        <li><strong>Wrong number</strong> — the number does not belong to the person who posted, or does not exist</li>
        <li><strong>Unreachable</strong> — you called repeatedly and nobody ever answered</li>
        <li><strong>Already hired</strong> — they had found a tutor before you paid to reach them</li>
        <li><strong>Not looking</strong> — they answered and said they never wanted a tutor</li>
        <li><strong>Duplicate enquiry</strong> — the same request posted twice, so you paid twice for one family</li>
        <li><strong>Wrong subject or area</strong> — the enquiry did not describe what the student actually wanted</li>
        <li><strong>Abusive</strong> — the contact was abusive. Refunded, and dealt with separately</li>
        <li><strong>Something else</strong> — tell us what happened</li>
      </ul>
      <p>
        The seven days are not arbitrary. A dispute raised weeks later cannot be looked into
        honestly: neither you nor the student will remember the call with any precision.
      </p>

      <h2>How a dispute is decided</h2>
      <p>
        A person reads it. If we uphold it, the credits go back into your wallet with a note in
        your credit history saying why, and the student&apos;s enquiry gets its response slot back
        so another tutor can take it — a parent promised five responses who got one unusable one
        should still end up with five usable ones.
      </p>
      <p>
        <strong>Refunded credits never expire.</strong> You paid for them once; putting a fresh
        clock on them would be a second penalty for a lead that was not your fault.
      </p>
      <p>
        <strong>If we decline, we tell you why.</strong> A refusal with no reason is one you can
        neither argue with nor learn from.
      </p>
      <p>
        You can dispute each lead once. That limit exists so nobody can be refunded more than they
        were charged.
      </p>

      <h2>What we do not refund</h2>
      <ul>
        <li>
          <strong>Credits you have not spent.</strong> Credits are not money in an account. We do
          not convert them back to rupees, and we cannot: they are priced as a bundle, and buying
          the largest pack and cashing out the remainder would simply be a discount on the
          smallest.
        </li>
        <li>
          <strong>A lead that reached a real person who was genuinely looking.</strong> That is the
          product working. A student choosing a different tutor is the ordinary outcome of a
          marketplace, not a fault.
        </li>
        <li>
          <strong>Credits that have expired.</strong> Purchased credits last 365 days; free credits
          from verifying your ID last 90. We warn you before either lapses.
        </li>
      </ul>

      <h2>Disputes we notice ourselves</h2>
      <p>
        We watch two patterns. A tutor disputing more than 30% of their leads, and an enquiry
        disputed by three or more different tutors. Both are flags for a person to look at, not
        automatic blocks — a tutor whose leads really are bad is exactly the person a hard cutoff
        would punish, and they are already the one being let down.
      </p>

      <h2>If your account is closed</h2>
      <p>
        If you delete your account, unspent credits are forfeited. If we suspend an account for
        breaking the conduct rules, unspent credits are forfeited too. We tell you the reason in
        both cases.
      </p>

      <h2>Raising a dispute</h2>
      <p>
        From <strong>My leads</strong>, open the lead and choose <em>Dispute this lead</em>. If you
        cannot reach that screen, write to us and we will raise it for you.
      </p>
    </>
  );
}
