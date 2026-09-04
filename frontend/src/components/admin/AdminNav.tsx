"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The console's own navigation.
 *
 * <p>Ordered by how often it is opened, not by how the backend is organised. Whoever is in here is
 * usually working a queue — verifications, reviews, disputes — and the dashboard is what they look
 * at once a day. Grouping by module would put pricing next to disputes because both live in
 * billing, which is true and useless.
 */

const SECTIONS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Queues",
    links: [
      { href: "/admin/verifications", label: "Verifications" },
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/disputes", label: "Disputes" },
      { href: "/admin/requirements", label: "Enquiries" },
      { href: "/admin/reports", label: "Reports" },
    ],
  },
  {
    heading: "Accounts",
    links: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/credits", label: "Credits" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/pricing", label: "Pricing" },
      { href: "/admin/audit", label: "Audit log" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="space-y-5">
      {SECTIONS.map((section) => (
        <div key={section.heading}>
          <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
            {section.heading}
          </p>
          <ul className="space-y-0.5">
            {section.links.map((link) => {
              // Exact match for the dashboard, prefix match for the rest: /admin is a prefix of
              // every other route, so a prefix test would light up the whole menu at once.
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                        : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
