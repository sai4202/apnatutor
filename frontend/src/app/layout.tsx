import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AuthProvider } from "@/lib/auth";

// SEO is this product's primary acquisition channel (SOURCE_OF_TRUTH ADR #3),
// so metadata is set up properly from the start rather than bolted on at M6.
// `template` means each page supplies only its own name and inherits the suffix.
export const metadata: Metadata = {
  title: {
    default: "ApnaTutor — Find home and online tutors near you",
    template: "%s | ApnaTutor",
  },
  description:
    "Post your tuition requirement for free and connect with verified home and online tutors near you. Apna tutor, apne ghar ke paas.",
  metadataBase: new URL("https://apnatutor.in"),
  openGraph: {
    siteName: "ApnaTutor",
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The brand colour tints the browser chrome on Android, which is where most
  // of this site's traffic will come from.
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      {/* No bg utility here — the ground colour is set on body in globals.css,
          so the panels laid on top read as raised surfaces. */}
      <body className="flex min-h-screen flex-col text-ink-800 antialiased">
        {/* First focusable element on the page. Keyboard and screen-reader users
            should not have to tab through the whole nav on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        {/* The provider is a Client Component, but everything inside it stays a
            Server Component — children are passed through, not re-rendered on
            the client. The public pages keep shipping zero JavaScript. */}
        <AuthProvider>
          {/* Skip link (M6-03.1). First thing in the tab order, invisible until focused. Without
              it a keyboard or screen-reader user tabs through the whole header — search box,
              subject menu, account links — on every page before reaching the content. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
