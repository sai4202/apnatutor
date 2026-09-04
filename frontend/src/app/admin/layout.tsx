import type { Metadata } from "next";
import { RequireRole } from "@/components/RequireRole";
import { AdminNav } from "@/components/admin/AdminNav";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Admin",
  // Nothing under /admin should ever be indexed. Everything here is private, and a crawler
  // following a stray link would only ever reach the login redirect.
  robots: { index: false, follow: false },
};

/**
 * The admin console — M5-06.1.
 *
 * <p>{@link RequireRole} is a UX affordance, not the security boundary. Every endpoint the console
 * calls carries a class-level {@code @PreAuthorize("hasRole('ADMIN')")}; this guard exists so a
 * student who opens the URL gets sent home instead of a screen full of 403s.
 *
 * <p>A sidebar rather than a top bar. The console is a set of queues that are worked in turn, and
 * the useful thing to see while working one is what else is waiting — which a horizontal menu that
 * collapses to a hamburger cannot show. It stacks above the content on a phone, where it is
 * consulted rather than watched.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="ADMIN">
      <Container className="py-6 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="lg:w-52 lg:shrink-0">
            <div className="lg:sticky lg:top-6">
              <AdminNav />
            </div>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </Container>
    </RequireRole>
  );
}
