import type { ReactNode } from "react";

/**
 * An icon and colour per subject category.
 *
 * <h2>Why more than one colour, when the palette is deliberately one accent</h2>
 *
 * Blue stays the <em>action</em> colour — every button and link is blue, and
 * nothing else is. These hues are used only inside a small icon tile, never on
 * an interactive element, so they add scannability without ever competing with
 * a call to action.
 *
 * The point is recognition speed. A parent scanning seven categories finds
 * "Music &amp; Dance" faster by its rose tile than by reading seven labels, and
 * on a return visit they navigate by colour memory alone.
 *
 * Hues are spaced around the wheel so no two adjacent categories read as the
 * same at a glance, and all are 50/600 pairs so contrast is consistent.
 *
 * <h2>Why the classes are written out in full</h2>
 *
 * Tailwind extracts class names statically from source, so a constructed string
 * like {@code `bg-${hue}-50`} produces no CSS at all. Every class here is a
 * complete literal for that reason — not verbosity for its own sake.
 */

type CategoryStyle = {
  tile: string;
  icon: ReactNode;
};

const FALLBACK: CategoryStyle = {
  tile: "bg-ink-100 text-ink-600",
  icon: <path d="M4 6h16M4 12h16M4 18h10" />,
};

const CATEGORIES: Record<string, CategoryStyle> = {
  "school-tuition": {
    tile: "bg-blue-50 text-blue-600",
    // Open book
    icon: (
      <>
        <path d="M12 6.5S9.5 4.8 4 5.4v12.2c5.5-.6 8 1.1 8 1.1s2.5-1.7 8-1.1V5.4c-5.5-.6-8 1.1-8 1.1z" />
        <path d="M12 6.5V19" />
      </>
    ),
  },
  "exam-preparation": {
    tile: "bg-violet-50 text-violet-600",
    // Target
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
      </>
    ),
  },
  languages: {
    tile: "bg-teal-50 text-teal-600",
    // Globe
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16" />
        <path d="M12 4a13 13 0 0 1 0 16a13 13 0 0 1 0-16z" />
      </>
    ),
  },
  "computers-it": {
    tile: "bg-indigo-50 text-indigo-600",
    // Angle brackets
    icon: (
      <>
        <path d="m9 8-4 4 4 4" />
        <path d="m15 8 4 4-4 4" />
      </>
    ),
  },
  "music-dance": {
    tile: "bg-rose-50 text-rose-600",
    // Musical note
    icon: (
      <>
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </>
    ),
  },
  "study-abroad-tests": {
    tile: "bg-amber-50 text-amber-600",
    // Paper plane
    icon: <path d="M21 3 3 10.5l7 3 3 7L21 3z" />,
  },
  "hobbies-sports": {
    tile: "bg-emerald-50 text-emerald-600",
    // Palette
    icon: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-4-4-7.3-9-7.3z" />
        <circle cx="7.5" cy="11" r="1" />
        <circle cx="11" cy="7.5" r="1" />
        <circle cx="15.5" cy="9" r="1" />
      </>
    ),
  },
};

export function categoryTile(slug: string): string {
  return (CATEGORIES[slug] ?? FALLBACK).tile;
}

export function CategoryIcon({
  slug,
  className = "h-5 w-5",
}: {
  slug: string;
  className?: string;
}) {
  const category = CATEGORIES[slug] ?? FALLBACK;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {category.icon}
    </svg>
  );
}
