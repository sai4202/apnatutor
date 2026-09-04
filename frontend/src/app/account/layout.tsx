import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

/**
 * Account settings, for any signed-in role.
 *
 * <p>No {@code RequireRole} guard: students, tutors and admins all need these screens, and the
 * pages beneath check for a session themselves. A guard here would have to name a role it does not
 * care about.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <Container className="py-6 sm:py-8">{children}</Container>;
}
