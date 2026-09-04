import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The rules for using ApnaTutor, for students, parents and tutors.",
  alternates: { canonical: "/terms" },
};

/**
 * Terms of service — M6-09.1.
 *
 * <p><strong>Draft. Needs a lawyer before launch.</strong> What an engineer can get right is that
 * every clause describes something the software actually does — the five-response cap, credits
 * being non-refundable in cash, suspension taking listings down immediately. What they cannot get
 * right is enforceability under Indian contract law, or the company details in the last section.
 */
export default function TermsPage() {
  return (
    <>
      <h1>Terms of service</h1>
      <p className="text-ink-500">Last updated 4 September 2026</p>

      <p>
        These are the rules for using ApnaTutor. Using the service means agreeing to them. We have
        tried to write them in plain language; where that has cost precision, the plain reading is
        the one we will act on.
      </p>

      <h2>1. What ApnaTutor is</h2>
      <p>
        We are an introduction service. Students and parents post what tutoring they need, for
        free. Tutors pay us credits to see the contact details and get in touch.
      </p>
      <p>
        <strong>We are not a party to what happens next.</strong> We do not employ tutors, set
        lesson fees, take a cut of them, supervise lessons or guarantee outcomes. The arrangement
        is between the student and the tutor. We verify what we reasonably can and tell you exactly
        what we have verified.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You must be 18 or over to hold an account. A parent or guardian should hold the account for a child.</li>
        <li>One account per person, and one role — student or tutor, not both.</li>
        <li>Your phone number is your identity here. Keep access to it.</li>
        <li>Everything you tell us about yourself must be true. That matters most for tutors: a qualification you do not hold is a claim a parent will rely on.</li>
      </ul>

      <h2>3. For students and parents</h2>
      <ul>
        <li>Posting an enquiry is free and always will be.</li>
        <li>Up to <strong>five tutors</strong> can unlock any one enquiry. We cap it there so your phone does not become a call centre.</li>
        <li>Posting means asking to be contacted. Those five tutors get your name and number.</li>
        <li>An enquiry stays live for 30 days, or until you mark it hired or close it.</li>
        <li>Post real enquiries. Fake ones waste money that tutors actually paid.</li>
      </ul>

      <h2>4. For tutors</h2>
      <ul>
        <li>Credits buy introductions, not lessons and not results. A student who does not reply is a normal outcome; a number that does not work is not, and that is what the <Link href="/refund-policy">refund policy</Link> is for.</li>
        <li>The credit price of an enquiry is fixed when the student posts it and shown before you unlock. It never changes afterwards.</li>
        <li>Purchased credits last 365 days. Free credits from verifying your ID last 90. We warn you before either lapses.</li>
        <li><strong>Credits are not money in an account.</strong> We do not convert them back to rupees.</li>
        <li>
          Contact details you unlock are for contacting that student about that enquiry.
          Not for a mailing list, not to resell, not to pass to another tutor.
        </li>
        <li>
          Do not ask students to arrange things off the platform to avoid credits. It is the one
          behaviour that ends marketplaces, and it is grounds for suspension.
        </li>
      </ul>

      <h2>5. Reviews</h2>
      <p>
        Only a student a tutor was actually put in touch with can review them. Every review is read
        by a moderator before it appears. A tutor gets one public reply to each review, also
        moderated. We publish reviews under a first name and an initial.
      </p>
      <p>
        We will not remove a review for being unflattering. We will remove one that is abusive,
        untrue, or written by somebody with an interest in the outcome.
      </p>

      <h2>6. Conduct</h2>
      <p>Do not use ApnaTutor to:</p>
      <ul>
        <li>harass, threaten or abuse anyone;</li>
        <li>impersonate anybody, or claim qualifications you do not hold;</li>
        <li>post fake enquiries, or reviews you have any interest in;</li>
        <li>collect contact details for anything other than the enquiry you unlocked;</li>
        <li>attempt to break, overload or probe the service.</li>
      </ul>
      <p>
        Anyone can report a profile, review or enquiry. A person reads every report and decides;
        nothing is removed automatically by report volume alone.
      </p>

      <h2>7. Suspension and closure</h2>
      <p>
        We can suspend an account that breaks these rules. If we do, we tell you the reason. A
        suspended tutor comes out of search results immediately, and a suspended student&apos;s
        live enquiries are taken down — with the tutors who paid for them refunded.
      </p>
      <p>
        You can delete your account at any time from <Link href="/account/data">Your data</Link>.
        Unspent credits are forfeited on closure, whoever closed it.
      </p>

      <h2>8. What we do not promise</h2>
      <p>
        We do not promise that a tutor will contact you, that a student will reply, that a tutor
        suits your child, or that the service will be available without interruption. We verify
        identity documents where a tutor supplies them and we show you exactly what has been
        verified — but a verified identity is not a character reference.
      </p>
      <p>
        <strong>Meet safely.</strong> For home tuition, we strongly recommend a parent is present,
        at least at first.
      </p>

      <h2>9. Liability</h2>
      <p>
        To the extent the law allows, our liability to you is limited to the amount you have paid
        us in the twelve months before the claim. For a student, who pays us nothing, that is nil —
        which is the honest consequence of a service that is free to you.
      </p>
      <p>
        Nothing here limits liability for anything that cannot lawfully be limited, including
        fraud.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may change these terms. If a change matters, we will say so on the site rather than
        quietly updating the date. Continuing to use ApnaTutor after that means accepting them.
      </p>

      <h2>11. Law and contact</h2>
      <p>
        These terms are governed by Indian law, and the courts of Hyderabad, Telangana have
        exclusive jurisdiction.
      </p>
      <p className="rounded-lg bg-warning-50 p-4 text-sm text-warning-600 ring-1 ring-warning-600/20">
        <strong>Not yet complete.</strong> The registered company name, address, GSTIN and a
        grievance officer&apos;s contact details must appear here before launch, and these terms
        need a lawyer&apos;s review. See <code>docs/PENDING.md</code> D2 and D6.
      </p>
    </>
  );
}
