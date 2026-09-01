import type { Metadata } from "next";
import { RequireRole } from "@/components/RequireRole";

export const metadata: Metadata = {
  title: "My enquiries",
  // Private. A crawler following a stray link would only ever see the login
  // redirect, and spending crawl budget on that costs the SEO pages.
  robots: { index: false, follow: false },
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireRole role="STUDENT">{children}</RequireRole>;
}
