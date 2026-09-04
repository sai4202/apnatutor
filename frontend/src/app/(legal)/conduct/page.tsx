import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conduct guidelines",
  description:
    "What we expect of tutors and of students on ApnaTutor, and how to stay safe arranging home tuition.",
  alternates: { canonical: "/conduct" },
};

/**
 * Conduct guidelines — M6-09.4.
 *
 * <p>Separate from the terms on purpose. The terms are a contract nobody reads; this is advice
 * somebody might. The safety section in particular is the one piece of writing on this site that
 * could matter more than everything else combined — home tuition means a stranger in a house with
 * a child, and saying so plainly is worth more than any amount of verification badging.
 */
export default function ConductPage() {
  return (
    <>
      <h1>Conduct guidelines</h1>
      <p className="text-ink-500">Last updated 4 September 2026</p>

      <p>
        These are not the <Link href="/terms">terms of service</Link>. They are what we expect of
        people here, and what we think makes tutoring work.
      </p>

      <h2>Staying safe</h2>
      <p>
        Home tuition means somebody you have not met coming into your house, usually to teach a
        child. Verification helps and is not a substitute for care.
      </p>
      <ul>
        <li>
          <strong>For the first few sessions, have an adult at home</strong> and in earshot. Most
          families continue this permanently and no good tutor minds.
        </li>
        <li>
          <strong>Meet somewhere public first</strong> if you would rather — a library or a café.
          A tutor who objects to that has told you something.
        </li>
        <li>
          <strong>Check what &ldquo;verified&rdquo; means on the profile.</strong> We show exactly
          what we checked: a verified ID means we have seen a government document matching the
          name. It is not a background check and it is not a character reference.
        </li>
        <li>
          <strong>Ask for references</strong> from families they have taught, and call them.
        </li>
        <li>
          <strong>Lessons for a child should be somewhere visible</strong> — a living room rather
          than a bedroom, with the door open.
        </li>
        <li>
          <strong>If something feels wrong, stop.</strong> You owe nobody a second session. Report
          it to us, and to the police if it warrants that.
        </li>
      </ul>

      <h2>If you are a tutor</h2>
      <h3>Expected</h3>
      <ul>
        <li>Describe your experience and qualifications exactly as they are. A parent will rely on what you write.</li>
        <li>Reply to an enquiry you unlocked. You paid for the introduction; not using it wastes your own money and the family&apos;s time.</li>
        <li>Be clear about fees, timings and travel before the first lesson, not after.</li>
        <li>Turn up, or give as much notice as you can when you cannot.</li>
        <li>Protect what families tell you. You will learn things about a child&apos;s difficulties that are not yours to repeat.</li>
      </ul>

      <h3>Not acceptable</h3>
      <ul>
        <li>Claiming a qualification, institution or result you do not have.</li>
        <li>
          Asking a family to arrange things off the platform to avoid credits. It is unfair to
          every tutor who pays, and it is grounds for suspension.
        </li>
        <li>Using a contact you unlocked for anything but that enquiry.</li>
        <li>Contacting a family repeatedly after they have said no.</li>
        <li>Being alone with a child in circumstances a parent has not agreed to.</li>
      </ul>

      <h2>If you are a student or parent</h2>
      <h3>Expected</h3>
      <ul>
        <li>Post a real enquiry, describing what you actually want. Tutors pay to reach you.</li>
        <li>
          Reply to tutors who contact you, even to say no. A short &ldquo;we have chosen somebody
          else&rdquo; costs you nothing and saves them chasing.
        </li>
        <li>Mark your enquiry hired or closed when you are done, so tutors stop paying for it.</li>
        <li>Agree the fee before the first lesson, and pay what you agreed.</li>
        <li>Review honestly, including when it is unflattering. It is the most useful thing you can do for the next parent.</li>
      </ul>

      <h3>Not acceptable</h3>
      <ul>
        <li>Posting an enquiry you do not mean, or posting the same one repeatedly.</li>
        <li>Using the enquiry form to advertise or to collect tutors&apos; details.</li>
        <li>Reviews about anything other than the teaching.</li>
        <li>Asking a tutor to work without agreeing what they will be paid.</li>
      </ul>

      <h2>Reporting</h2>
      <p>
        Every tutor profile, review and enquiry can be reported, and a person reads every report.
        Nothing is removed by report volume alone, and we tell you the outcome either way — even
        when we decide there is nothing to act on.
      </p>
      <p>
        If somebody is in immediate danger, contact the police first. We are not an emergency
        service.
      </p>
    </>
  );
}
