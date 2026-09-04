import { Container } from "@/components/ui";

/**
 * Shared shell for the legal pages — M6-09.
 *
 * <p>A route group, so the URLs stay `/terms` and `/privacy` rather than `/legal/terms`. Those are
 * the paths already linked from the footer and the ones people expect to be able to type.
 *
 * <p>Server-rendered prose with no client JavaScript. These pages are read once, often on a slow
 * connection, and sometimes by somebody who needs them in a hurry.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-10 sm:py-14">
      <article className="prose-legal mx-auto max-w-3xl">{children}</article>
    </Container>
  );
}
