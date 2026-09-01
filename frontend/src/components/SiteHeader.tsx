import Link from "next/link";
import { AccountMenu } from "@/components/AccountMenu";
import { Container, Icon } from "@/components/ui";

/**
 * The ApnaTutor wordmark.
 *
 * "Apna" in ink, "Tutor" in brand blue — the split makes the two halves legible
 * as one name while giving the blue somewhere to live in the header without
 * adding a logo image to load.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-ink-900">Apna</span>
      <span className="text-brand-600">Tutor</span>
    </span>
  );
}

const NAV = [
  { href: "/tutors", label: "Find a tutor" },
  { href: "/post-requirement", label: "Post a requirement" },
  { href: "/for-tutors", label: "For tutors" },
];

/**
 * Sticky header.
 *
 * Sticky because the primary conversion action — posting a requirement — should
 * never be more than a glance away, however far down the page someone has read.
 *
 * The mobile navigation is a details/summary disclosure rather than a JavaScript
 * menu: it keeps this a Server Component, works before hydration, and is
 * keyboard-accessible for free.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200/70 bg-white/85 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="shrink-0 text-xl sm:text-2xl">
            <Wordmark />
            <span className="sr-only">ApnaTutor home</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <AccountMenu />
          </div>

          <details className="relative md:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100">
              <Icon name="menu" className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </summary>
            <div className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-white p-2 shadow-lg ring-1 ring-ink-200">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-ink-200" />
              <AccountMenu layout="stacked" />
            </div>
          </details>
        </div>
      </Container>
    </header>
  );
}
