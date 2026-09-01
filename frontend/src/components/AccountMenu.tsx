"use client";

import Link from "next/link";
import { useAuth, type UserRole } from "@/lib/auth";
import { ButtonLink } from "@/components/ui";

/**
 * The signed-in / signed-out slot in the header.
 *
 * <p>This is the only client component in the header, and deliberately so. The
 * header sits on every public page including the programmatic city×subject pages
 * that are the acquisition channel; making the whole thing client-side to render
 * one link would cost those pages their server rendering. Isolating the session-
 * dependent part keeps the rest server-rendered.
 *
 * <p>It renders the signed-out state while the session is still resolving. A
 * spinner here would flicker on every page load for the majority of visitors, who
 * have no session at all.
 */

const HOME_FOR_ROLE: Record<UserRole, { href: string; label: string }> = {
  STUDENT: { href: "/student/requirements", label: "My enquiries" },
  TUTOR: { href: "/tutor/dashboard", label: "My dashboard" },
  ADMIN: { href: "/admin", label: "Admin" },
};

export function AccountMenu({ layout = "inline" }: { layout?: "inline" | "stacked" }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return layout === "stacked" ? (
      <>
        <Link
          href="/login"
          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-brand-50"
        >
          Sign in
        </Link>
        <ButtonLink href="/post-requirement" size="sm" className="mt-1 w-full">
          Post a requirement
        </ButtonLink>
      </>
    ) : (
      <>
        <ButtonLink href="/login" variant="ghost" size="sm">
          Sign in
        </ButtonLink>
        <ButtonLink href="/post-requirement" size="sm">
          Post a requirement
        </ButtonLink>
      </>
    );
  }

  const home = HOME_FOR_ROLE[user.role];

  // A tutor is here to find work, not to post a requirement; sending them to the
  // parent-side call to action would be noise. Their own page is the action.
  const secondary =
    user.role === "TUTOR"
      ? { href: "/tutor/leads", label: "Enquiries" }
      : { href: "/post-requirement", label: "Post a requirement" };

  return layout === "stacked" ? (
    <>
      <Link
        href={home.href}
        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-brand-50"
      >
        {home.label}
      </Link>
      <ButtonLink href={secondary.href} size="sm" className="mt-1 w-full">
        {secondary.label}
      </ButtonLink>
    </>
  ) : (
    <>
      <ButtonLink href={home.href} variant="ghost" size="sm">
        {home.label}
      </ButtonLink>
      <ButtonLink href={secondary.href} size="sm">
        {secondary.label}
      </ButtonLink>
    </>
  );
}
