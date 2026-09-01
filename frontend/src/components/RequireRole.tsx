"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/lib/auth";
import { Container, Icon } from "@/components/ui";

/**
 * Client-side route guard.
 *
 * <p><strong>This is a UX affordance, not a security control.</strong> Anyone can edit client state
 * and render whatever they like. The actual enforcement is the backend's {@code @PreAuthorize} on
 * every endpoint — this only spares an unauthorised visitor a screen full of failed requests.
 *
 * <p>The loading branch matters more than it looks. Redirecting before the initial refresh settles
 * would bounce a signed-in user to the login screen on every page reload, because the session is
 * genuinely unknown for those few hundred milliseconds.
 */
export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      // Signed in as the wrong kind of account. Home rather than the login
      // screen — they are not unauthenticated, they are in the wrong place.
      router.replace("/");
    }
  }, [user, loading, role, router]);

  if (loading) {
    return (
      <Container className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-ink-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
          Loading…
        </div>
      </Container>
    );
  }

  if (!user || user.role !== role) {
    // The redirect is in flight. Rendering nothing avoids a flash of content the
    // visitor is not entitled to see.
    return null;
  }

  return <>{children}</>;
}

/** A small inline error banner, used across the authenticated screens. */
export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700 ring-1 ring-danger-600/20"
    >
      <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
