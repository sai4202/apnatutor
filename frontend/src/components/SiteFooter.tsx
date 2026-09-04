import Link from "next/link";
import { Container } from "@/components/ui";
import { Wordmark } from "@/components/SiteHeader";

/**
 * Footer.
 *
 * The city and subject link columns are not decoration — they are internal
 * linking for the programmatic landing pages (M2-07), which are this product's
 * primary acquisition channel. A footer that links every city×subject page from
 * every page is how those pages get discovered and ranked.
 */

const POPULAR_SUBJECTS = [
  { label: "Mathematics", slug: "mathematics" },
  { label: "Physics", slug: "physics" },
  { label: "Spoken English", slug: "spoken-english" },
  { label: "JEE Main", slug: "jee-main" },
  { label: "NEET", slug: "neet" },
  { label: "Guitar", slug: "guitar" },
];

const CITIES = [
  { label: "Hyderabad", slug: "hyderabad" },
  { label: "Bengaluru", slug: "bengaluru" },
  { label: "Mumbai", slug: "mumbai" },
  { label: "Delhi", slug: "delhi" },
  { label: "Pune", slug: "pune" },
  { label: "Chennai", slug: "chennai" },
];

const COMPANY = [
  { label: "About us", href: "/about" },
  { label: "For tutors", href: "/for-tutors" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Contact", href: "/contact" },
];

const LEGAL = [
  { label: "Terms of service", href: "/terms" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Refund policy", href: "/refund-policy" },
  // In the footer rather than behind the account menu, deliberately. The right to a copy of your
  // data and the right to delete it are worth nothing if they are hard to find, and the footer is
  // the one place present on every page for every visitor (M5-10).
  { label: "Your data", href: "/account/data" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-ink-600 transition-colors hover:text-brand-700"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    /* No background of its own — it sits directly on the page canvas, which
       reads as "outside the content" and keeps the panels above it as the only
       white surfaces. */
    <footer className="mt-6 border-t border-ink-300/70">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="text-xl">
              <Wordmark />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-600">
              Apna tutor, apne ghar ke paas. Post what you need — verified tutors
              near you get in touch.
            </p>
          </div>

          <FooterColumn
            title="Popular subjects"
            links={POPULAR_SUBJECTS.map((s) => ({
              label: s.label,
              href: `/tutors/hyderabad/${s.slug}`,
            }))}
          />
          <FooterColumn
            title="Cities"
            links={CITIES.map((c) => ({
              label: `Tutors in ${c.label}`,
              href: `/tutors/${c.slug}`,
            }))}
          />
          <FooterColumn title="Company" links={COMPANY} />
          <FooterColumn title="Legal" links={LEGAL} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink-300/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-500">
            © {new Date().getFullYear()} ApnaTutor. Made in India.
          </p>
          <p className="text-sm text-ink-500">
            Tuition fees are paid directly to your tutor. ApnaTutor never handles them.
          </p>
        </div>
      </Container>
    </footer>
  );
}
