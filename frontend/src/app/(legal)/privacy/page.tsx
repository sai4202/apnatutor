import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What ApnaTutor collects, why, who sees it, and how to get a copy or delete your account. Written for India's DPDP Act.",
  alternates: { canonical: "/privacy" },
};

/**
 * Privacy policy — M6-09.2, DPDP-aware.
 *
 * <p>Written against what the code actually does, section by section: contact details are sold to
 * tutors and that is stated plainly rather than buried; deletion anonymises rather than erases and
 * the reason is given; identity documents are destroyed on deletion; the audit log records
 * administrator access.
 *
 * <p><strong>This is a draft and needs a lawyer before launch.</strong> The facts in it are
 * accurate to the implementation, which is the part an engineer can get right; whether it satisfies
 * the DPDP Act's notice and consent requirements is the part they cannot.
 */
export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="text-ink-500">Last updated 4 September 2026</p>

      <p>
        This explains what ApnaTutor holds about you, why, and what you can do about it. It is
        written to be read rather than to be defensible, and it describes what the product actually
        does today.
      </p>

      <h2>The one thing worth knowing first</h2>
      <p>
        <strong>Tutors pay us to see a student&apos;s phone number.</strong> That is our entire
        business model, and it is the most important fact in this policy. When you post an enquiry
        as a parent or student, you are asking tutors to contact you, and up to five of them will
        pay for the ability to do so. We tell you who they are. We do not sell your number to
        anyone else, we do not sell it in bulk, and it is never shown on a public page.
      </p>

      <h2>What we collect</h2>
      <h3>Everyone</h3>
      <ul>
        <li>Your phone number. It is how you sign in — we do not use passwords by default.</li>
        <li>Your email address, if you give us one. Optional.</li>
        <li>When you signed up and when you were last active.</li>
      </ul>

      <h3>If you post an enquiry</h3>
      <ul>
        <li>
          The subject, class, board, area, budget and timings you enter, and anything you write in
          the description.
        </li>
        <li>Which tutors unlocked your enquiry, and when.</li>
      </ul>

      <h3>If you are a tutor</h3>
      <ul>
        <li>
          Your profile: name, headline, biography, photograph, experience, fees, subjects and
          areas. All of this is public once you publish it.
        </li>
        <li>
          Identity and education documents you upload for verification.{" "}
          <strong>These are never public.</strong> They are readable only by an administrator,
          every read is recorded, and they are destroyed if you delete your account.
        </li>
        <li>Your credit balance, every credit transaction, and your payment records.</li>
        <li>Which enquiries you unlocked and any disputes you raised.</li>
      </ul>

      <h3>Automatically</h3>
      <ul>
        <li>Your IP address, on requests we rate limit or record in the administrator audit log.</li>
        <li>Ordinary server logs.</li>
      </ul>

      <h2>Who sees what</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Who can see it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A tutor&apos;s published profile</td>
            <td>Anyone, including search engines</td>
          </tr>
          <tr>
            <td>Your enquiry, without your name or number</td>
            <td>Tutors who match the subject and area</td>
          </tr>
          <tr>
            <td>Your name and phone number</td>
            <td>Only tutors who spent credits on your enquiry, and administrators</td>
          </tr>
          <tr>
            <td>Reviews you write</td>
            <td>Anyone — shown as a first name and an initial, such as &ldquo;Priya S.&rdquo;</td>
          </tr>
          <tr>
            <td>Identity documents</td>
            <td>Administrators only. Every access is logged.</td>
          </tr>
          <tr>
            <td>Payment card details</td>
            <td>Nobody here. Our payment provider handles them; we never receive them.</td>
          </tr>
        </tbody>
      </table>

      <h2>Who we share it with</h2>
      <p>We use a small number of providers, and only for the job named:</p>
      <ul>
        <li>
          <strong>Razorpay</strong> — taking payments. They receive the amount and your contact
          details for the receipt; we never see your card.
        </li>
        <li>
          <strong>An SMS provider</strong> — sending your one-time sign-in code. They receive your
          phone number and the code.
        </li>
        <li><strong>Our hosting and database provider</strong> — running the service.</li>
      </ul>
      <p>
        We do not sell your data to advertisers, data brokers, or anyone else. We will disclose it
        if a court or a law validly requires it, and we will tell you unless we are forbidden to.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li><strong>Your account</strong> — until you delete it.</li>
        <li><strong>Enquiries</strong> — 30 days live, then kept as history.</li>
        <li><strong>Identity documents</strong> — until you delete your account, then destroyed.</li>
        <li>
          <strong>Payment and credit records</strong> — kept indefinitely, without your personal
          details, once you leave. They are financial records of money that moved.
        </li>
        <li>
          <strong>Administrator action records</strong> — kept indefinitely, without your personal
          details.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>
        Under India&apos;s Digital Personal Data Protection Act you can ask for a copy of your data
        and ask us to delete it. Both are buttons rather than emails:{" "}
        <Link href="/account/data">Your data</Link>.
      </p>

      <h3>What deletion actually does</h3>
      <p>
        We erase your phone number, email, profile and uploaded documents immediately, and take any
        live enquiry down.
      </p>
      <p>
        <strong>We do not delete your credit and payment records.</strong> They are append-only
        financial records, and other people&apos;s accounts reference them — removing yours would
        break the record of money that genuinely moved between us and a tutor you dealt with. What
        we do instead is strip everything that identifies you from them, so what remains is a
        transaction with no person attached.
      </p>
      <p>
        <strong>Reviews you wrote stay published.</strong> They are about a tutor, other parents
        have relied on them when choosing, and they never carried your full name.
      </p>

      <h2>Security</h2>
      <ul>
        <li>
          Sign-in codes are stored only as a hash. A leak of our database would not hand anyone a
          working code.
        </li>
        <li>
          Session tokens are hashed, rotated, and revoked as a family if one is ever reused.
        </li>
        <li>Contact details are masked everywhere except where they have been paid for.</li>
        <li>
          Identity documents are served only to administrators, never cached, and every read is
          recorded against the administrator who made it.
        </li>
      </ul>
      <p>
        No service is perfectly secure, and anyone who tells you otherwise is selling something. If
        you find a vulnerability, please tell us before telling anyone else.
      </p>

      <h2>Children</h2>
      <p>
        Much of our tutoring is for school children, and we expect a parent or guardian to hold the
        account rather than the child. We do not knowingly let under-18s create accounts. If you
        believe a child has, tell us and we will remove it.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this in a way that matters, we will say so on the site rather than quietly
        updating the date at the top.
      </p>
    </>
  );
}
