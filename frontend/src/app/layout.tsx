import type { Metadata } from "next";
import "./globals.css";

// SEO is the primary acquisition channel for this product (SOURCE_OF_TRUTH.md ADR #3), so the
// metadata is set up properly from the first commit rather than bolted on at M6.
// `template` means each page supplies only its own name and inherits the brand suffix.
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
