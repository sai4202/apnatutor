import type { ReactNode } from "react";

/**
 * A landmark glyph per city.
 *
 * Generic pin icons on ten city tiles are ten identical shapes — the eye has to
 * read every label. A Charminar silhouette next to a Gateway of India is
 * recognised before the label is read, which is the entire job of an icon.
 *
 * It also does something a pin cannot: it says this product is Indian and knows
 * these places. For a marketplace asking parents to trust it with their home
 * address, that specificity is worth more than the pixels cost.
 *
 * Drawn as minimal line art rather than detailed illustration: these render at
 * 24-32px, where detail becomes mud. Single stroke weight, {@code currentColor},
 * no fills — so one glyph works on any background at any size.
 */

const LANDMARKS: Record<string, ReactNode> = {
  // Charminar — four minarets over an arched base
  hyderabad: (
    <>
      <path d="M4 21h16" />
      <path d="M6 21V11h12v10" />
      <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
      <path d="M6 11V7M18 11V7M9 11V8M15 11V8" />
      <path d="M6 7a1 1 0 0 1 2 0M16 7a1 1 0 0 1 2 0" />
      <path d="M9 5.5V8M15 5.5V8" />
    </>
  ),
  // Vidhana Soudha — central dome on a columned block
  bengaluru: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21v-8h14v8" />
      <path d="M12 5a4 4 0 0 1 4 4v4H8V9a4 4 0 0 1 4-4z" />
      <path d="M12 3v2" />
      <path d="M8 21v-4M12 21v-4M16 21v-4" />
    </>
  ),
  // Gateway of India — big central arch, flanking towers
  mumbai: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V9h14v12" />
      <path d="M9.5 21v-6a2.5 2.5 0 0 1 5 0v6" />
      <path d="M5 9 12 4l7 5" />
      <path d="M7 21v-3M17 21v-3" />
    </>
  ),
  // India Gate — single memorial arch
  delhi: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21V8h12v13" />
      <path d="M9.5 21v-8a2.5 2.5 0 0 1 5 0v8" />
      <path d="M6 8h12" />
      <path d="M8 8V6h8v2" />
    </>
  ),
  // Shaniwar Wada gateway
  pune: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21V10h12v11" />
      <path d="M10 21v-6h4v6" />
      <path d="M6 10h12M8 10V7h8v3" />
    </>
  ),
  // Gopuram — stepped temple tower
  chennai: (
    <>
      <path d="M4 21h16" />
      <path d="M7 21V9l5-5 5 5v12" />
      <path d="M7 13h10M7 17h10" />
      <path d="M10.5 21v-4h3v4" />
    </>
  ),
  // Howrah Bridge — trussed span
  kolkata: (
    <>
      <path d="M2 17h20" />
      <path d="M5 17V7M19 17V7" />
      <path d="M5 7h14" />
      <path d="m5 17 7-7 7 7" />
      <path d="M12 10v7" />
    </>
  ),
  // Sabarmati / stepwell arches
  ahmedabad: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21v-7a3 3 0 0 1 6 0v7" />
      <path d="M12 21v-9a3 3 0 0 1 6 0v9" />
      <path d="M6 14h6M12 12h6" />
    </>
  ),
  // Lighthouse — coastal city
  visakhapatnam: (
    <>
      <path d="M3 21h18" />
      <path d="M9 21 10 9h4l1 12" />
      <path d="M10 9h4" />
      <path d="M12 5v4" />
      <path d="M8 6.5 5.5 5M16 6.5 18.5 5" />
    </>
  ),
  // Hawa Mahal — tiered facade of windows
  jaipur: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8l7-4 7 4v13" />
      <path d="M9 21v-4h6v4" />
      <path d="M8 11h2M14 11h2M11 14h2" />
    </>
  ),
};

/** Generic skyline, for any city without its own glyph yet. */
const FALLBACK: ReactNode = (
  <>
    <path d="M3 21h18" />
    <path d="M5 21V10h5v11" />
    <path d="M14 21V6h5v15" />
    <path d="M7 13h1M7 16h1M16 9h1M16 13h1M16 17h1" />
  </>
);

export function CityIcon({
  slug,
  className = "h-6 w-6",
}: {
  slug: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {LANDMARKS[slug] ?? FALLBACK}
    </svg>
  );
}
