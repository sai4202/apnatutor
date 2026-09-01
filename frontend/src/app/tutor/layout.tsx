import type { Metadata } from "next";
import { RequireRole } from "@/components/RequireRole";

export const metadata: Metadata = {
  title: "Tutor dashboard",
  // Nothing under /tutor should ever be indexed: it is all private, and a
  // crawler following a stray link would only ever see the login redirect.
  robots: { index: false, follow: false },
};

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireRole role="TUTOR">{children}</RequireRole>;
}
