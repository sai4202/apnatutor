import type { ReactNode } from "react";

/**
 * A distinct glyph per subject.
 *
 * <h2>Why this exists</h2>
 *
 * The first version of the browse grid drew one icon per <em>category</em>, so
 * Mathematics, Physics, Chemistry, Biology and Science were five identical open
 * books on five identical blue tiles. The glyph carried no information at all —
 * the label was doing every bit of the work, which defeats the point of a visual
 * grid.
 *
 * A tile only earns its space if it is recognisable before the label is read.
 * So: a flask for Chemistry, an atom for Physics, a stethoscope for NEET, a
 * shuttlecock for Badminton.
 *
 * <h2>Language subjects use their own script</h2>
 *
 * Twelve languages would otherwise be twelve speech bubbles — the same problem
 * again. A Telugu tile showing అ and a Tamil tile showing அ are instantly
 * distinguishable, and to a reader of either they are more legible than any
 * icon could be. Rendered as text rather than paths, so they stay correct at any
 * size and need no font subsetting work.
 */

type Glyph = { paths: ReactNode } | { text: string };

const SUBJECTS: Record<string, Glyph> = {
  // --- School tuition -----------------------------------------------------
  mathematics: {
    paths: (
      <>
        <path d="M5 7h14" />
        <path d="M9 7c0 4-1.5 8-3 10h8" />
        <path d="M15 12h4M17 10v4" />
        <path d="M15 18h4" />
      </>
    ),
  },
  physics: {
    paths: (
      <>
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="9" ry="4" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)" />
      </>
    ),
  },
  chemistry: {
    paths: (
      <>
        <path d="M10 3v6L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3" />
        <path d="M9 3h6" />
        <path d="M7.5 14h9" />
        <circle cx="11" cy="17" r="0.9" />
        <circle cx="14" cy="18.5" r="0.7" />
      </>
    ),
  },
  biology: {
    paths: (
      <>
        <path d="M7 3c0 5 10 5 10 10s-10 5-10 8" />
        <path d="M17 3c0 3-10 3-10 8s10 5 10 10" />
        <path d="M8.5 7h7M8 11h8M8.5 15h7" />
      </>
    ),
  },
  science: {
    paths: (
      <>
        <path d="M6 21h12" />
        <path d="M9 3h4v6l4 7a2 2 0 0 1-1.7 3H8.7A2 2 0 0 1 7 16l4-7" />
        <path d="M9 3v2" />
        <circle cx="14" cy="8" r="1.2" />
      </>
    ),
  },
  english: { text: "Aa" },
  "social-science": {
    paths: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5a13 13 0 0 1 0 17a13 13 0 0 1 0-17z" />
      </>
    ),
  },
  history: {
    paths: (
      <>
        <path d="M7 3h10M7 21h10" />
        <path d="M8 3c0 4 8 5 8 9s-8 5-8 9" />
        <path d="M16 3c0 4-8 5-8 9s8 5 8 9" />
      </>
    ),
  },
  geography: {
    paths: (
      <>
        <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7z" />
        <path d="M9 4v13M15 7v13" />
      </>
    ),
  },
  "computer-science": {
    paths: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
        <path d="m10 8-2 2 2 2M14 8l2 2-2 2" />
      </>
    ),
  },
  accountancy: {
    paths: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h3M8 16h3" />
        <path d="M15 12v5M13 14.5h4" />
      </>
    ),
  },
  economics: {
    paths: (
      <>
        <path d="M4 20V5" />
        <path d="M4 20h16" />
        <path d="m7 15 3.5-4 3 2.5L20 7" />
        <path d="M16.5 7H20v3.5" />
      </>
    ),
  },
  "business-studies": {
    paths: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="M3 12h18" />
      </>
    ),
  },
  "political-science": {
    paths: (
      <>
        <path d="M3 21h18" />
        <path d="M4 10h16L12 4z" />
        <path d="M6.5 10v8M11 10v8M17.5 10v8" />
      </>
    ),
  },

  // --- Exam preparation ---------------------------------------------------
  "jee-main": {
    paths: (
      <>
        <path d="M12 2.5s4.5 3 4.5 8.5c0 2.5-1 4.5-2 5.5h-5c-1-1-2-3-2-5.5C7.5 5.5 12 2.5 12 2.5z" />
        <circle cx="12" cy="9.5" r="1.8" />
        <path d="M9.5 16.5 8 21l4-2 4 2-1.5-4.5" />
      </>
    ),
  },
  "jee-advanced": {
    paths: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <path d="m5 5 2.2 2.2M16.8 16.8 19 19M19 5l-2.2 2.2M7.2 16.8 5 19" />
      </>
    ),
  },
  neet: {
    paths: (
      <>
        <path d="M6 3v5a4 4 0 0 0 8 0V3" />
        <path d="M4.5 3h3M12.5 3h3" />
        <path d="M10 12v2a5 5 0 0 0 5 5h.5" />
        <circle cx="18" cy="18.5" r="2.5" />
      </>
    ),
  },
  "ca-foundation": {
    paths: (
      <>
        <rect x="5" y="2.5" width="14" height="19" rx="2" />
        <path d="M8.5 6.5h7" />
        <path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01" />
      </>
    ),
  },
  "cat-mba": {
    paths: (
      <>
        <path d="M3 20h18" />
        <rect x="4" y="12" width="4" height="8" />
        <rect x="10" y="8" width="4" height="12" />
        <rect x="16" y="4" width="4" height="16" />
      </>
    ),
  },
  upsc: {
    paths: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V9h14v12" />
        <path d="M4 9 12 3l8 6" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
  },
  gate: {
    paths: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
      </>
    ),
  },
  clat: {
    paths: (
      <>
        <path d="M12 3v18M7 21h10" />
        <path d="M4 7h16" />
        <path d="M4 7 1.5 13h5zM20 7l2.5 6h-5z" />
      </>
    ),
  },
  "bank-exams": {
    paths: (
      <>
        <path d="M2.5 21h19" />
        <path d="M4 21V10h16v11" />
        <path d="M2.5 10 12 4l9.5 6" />
        <path d="M8 21v-6M12 21v-6M16 21v-6" />
      </>
    ),
  },
  "ssc-exams": {
    paths: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h4" />
      </>
    ),
  },
  "nda-defence": {
    paths: (
      <>
        <path d="M12 2.5 4 6v6c0 5 3.5 8 8 9.5 4.5-1.5 8-4.5 8-9.5V6z" />
        <path d="m12 8 1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" />
      </>
    ),
  },

  // --- Languages: native script, not twelve identical speech bubbles ------
  "spoken-english": {
    paths: (
      <>
        <path d="M3 6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-4 3v-3a2 2 0 0 1-1-2z" />
        <path d="M19 9h.5a1.5 1.5 0 0 1 1.5 1.5V16a2 2 0 0 1-2 2h-1l-3 2.5V18" />
      </>
    ),
  },
  "hindi-language": { text: "अ" },
  telugu: { text: "అ" },
  tamil: { text: "அ" },
  kannada: { text: "ಅ" },
  marathi: { text: "म" },
  bengali: { text: "অ" },
  sanskrit: { text: "ॐ" },
  french: { text: "Fr" },
  german: { text: "De" },
  spanish: { text: "Es" },
  japanese: { text: "あ" },

  // --- Computers & IT -----------------------------------------------------
  python: {
    paths: (
      <>
        <path d="M12 3c-3 0-4.5 1-4.5 3v2.5h4.5" />
        <path d="M7.5 8.5H5.5C3.8 8.5 3 10 3 12s.8 3.5 2.5 3.5h2" />
        <path d="M12 21c3 0 4.5-1 4.5-3v-2.5H12" />
        <path d="M16.5 15.5h2c1.7 0 2.5-1.5 2.5-3.5s-.8-3.5-2.5-3.5h-2" />
        <circle cx="9.5" cy="6" r="0.6" />
        <circle cx="14.5" cy="18" r="0.6" />
      </>
    ),
  },
  java: {
    paths: (
      <>
        <path d="M5 11h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
        <path d="M16 12.5h2a2.5 2.5 0 0 1 0 5h-2" />
        <path d="M9 3c-1 1.5 0 2.5 1 3.5S11.5 8.5 11 9.5M13 4.5c-.7 1 0 1.8.6 2.5" />
      </>
    ),
  },
  "c-cpp": {
    paths: (
      <>
        <path d="M9 4H7a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h2" />
        <path d="M15 4h2a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-2" />
      </>
    ),
  },
  "web-development": {
    paths: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <circle cx="6.5" cy="6.5" r="0.6" />
        <circle cx="9" cy="6.5" r="0.6" />
        <path d="m10 13-1.5 1.5L10 16M14 13l1.5 1.5L14 16" />
      </>
    ),
  },
  "data-science": {
    paths: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
        <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
  },
  "machine-learning": {
    paths: (
      <>
        <circle cx="5" cy="6" r="2" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="12" cy="12" r="2.2" />
        <circle cx="19" cy="7.5" r="2" />
        <circle cx="19" cy="16.5" r="2" />
        <path d="m6.7 7 3.5 3.5M6.7 17l3.5-3.5M14 11l3.2-2M14 13.2l3.2 2" />
      </>
    ),
  },
  "ms-office": {
    paths: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M9 9v11" />
      </>
    ),
  },
  tally: {
    paths: (
      <>
        <rect x="4" y="2.5" width="16" height="19" rx="2" />
        <rect x="7" y="5.5" width="10" height="3.5" rx="1" />
        <path d="M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 17h.01M12 17h.01M16.5 17h.01" />
      </>
    ),
  },
  "graphic-design": {
    paths: (
      <>
        <path d="M12 2.5 4 8v8l8 5.5 8-5.5V8z" />
        <path d="m12 7-4 3v4l4 2.5 4-2.5v-4z" />
      </>
    ),
  },

  // --- Music & dance ------------------------------------------------------
  guitar: {
    paths: (
      <>
        <path d="m18 3-3 3" />
        <path d="M15.5 6.5 13 9" />
        <path d="M11 11a4.5 4.5 0 0 0-6 6.5A4 4 0 0 0 11.5 19 4.5 4.5 0 0 0 13 13" />
        <circle cx="9.5" cy="15" r="1.6" />
      </>
    ),
  },
  "keyboard-piano": {
    paths: (
      <>
        <rect x="2.5" y="6" width="19" height="12" rx="2" />
        <path d="M7 6v12M12 6v12M17 6v12" />
        <path d="M5.5 6v6h3V6M10.5 6v6h3V6M15.5 6v6h3V6" />
      </>
    ),
  },
  "carnatic-vocal": {
    paths: (
      <>
        <rect x="9" y="2.5" width="6" height="11" rx="3" />
        <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
        <path d="M12 17.5V21M9 21h6" />
      </>
    ),
  },
  "hindustani-vocal": {
    paths: (
      <>
        <path d="M2.5 12h2M20 12h1.5" />
        <path d="M6.5 8v8M9.5 5.5v13M13 9v6M16.5 6.5v11" />
      </>
    ),
  },
  violin: {
    paths: (
      <>
        <path d="M17 3.5 14 7" />
        <path d="M12.5 8.5c-2 0-3.5 1.5-3.5 3 0 1-1.5 1.5-1.5 3.5S9 18.5 11 18.5s3.5-1.5 3.5-3.5c0-1.5 1.5-2 1.5-3.5s-1.5-3-3.5-3z" />
        <path d="m6 20 3-3" />
      </>
    ),
  },
  tabla: {
    paths: (
      <>
        <ellipse cx="8" cy="10" rx="4.5" ry="2.5" />
        <path d="M3.5 10v5c0 1.4 2 2.5 4.5 2.5s4.5-1.1 4.5-2.5v-5" />
        <ellipse cx="17.5" cy="13" rx="3.5" ry="2" />
        <path d="M14 13v3.5c0 1.1 1.6 2 3.5 2s3.5-.9 3.5-2V13" />
      </>
    ),
  },
  drums: {
    paths: (
      <>
        <ellipse cx="12" cy="12" rx="8" ry="3.5" />
        <path d="M4 12v4c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-4" />
        <path d="m6 4 4 6M18 4l-4 6" />
      </>
    ),
  },
  bharatanatyam: {
    paths: (
      <>
        <circle cx="12" cy="4" r="2" />
        <path d="M12 6.5v6" />
        <path d="m12 8-4.5 2M12 8l4.5 2" />
        <path d="m12 12.5-3.5 4.5M12 12.5l3.5 4.5" />
        <path d="M6 21h12" />
      </>
    ),
  },
  kathak: {
    paths: (
      <>
        <circle cx="13" cy="4" r="2" />
        <path d="M13 6.5c-1 3-2 4-4 5" />
        <path d="M13 9c2 .5 3.5 2 4 4" />
        <path d="M12 11.5 9 21M12 11.5l4 4-1 5.5" />
      </>
    ),
  },
  "western-dance": {
    paths: (
      <>
        <circle cx="9" cy="4" r="1.8" />
        <path d="M9 6v5l-2 4 1 6" />
        <path d="m9 8 4-1.5 3 3" />
        <circle cx="17" cy="6" r="1.5" />
        <path d="m13 12 2 4-.5 5" />
      </>
    ),
  },

  // --- Study abroad tests -------------------------------------------------
  ielts: {
    paths: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5a13 13 0 0 1 0 17a13 13 0 0 1 0-17z" />
        <path d="m16 16 4 4" />
      </>
    ),
  },
  toefl: {
    paths: (
      <>
        <path d="M4 5h16v11H8l-4 3z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
  },
  gre: {
    paths: (
      <>
        <path d="M12 3 2.5 8 12 13l9.5-5z" />
        <path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" />
        <path d="M21.5 8v6" />
      </>
    ),
  },
  gmat: {
    paths: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        <path d="m8 13 2.5 2.5L16 10" />
      </>
    ),
  },
  sat: {
    paths: (
      <>
        <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <circle cx="9" cy="8" r="1.2" />
        <circle cx="9" cy="12" r="1.2" />
        <circle cx="9" cy="16" r="1.2" />
        <path d="M12.5 8h3M12.5 12h3M12.5 16h3" />
      </>
    ),
  },
  pte: {
    paths: (
      <>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M9 9v4M12 7.5v7M15 10v2.5" />
      </>
    ),
  },

  // --- Hobbies & sports ---------------------------------------------------
  "drawing-painting": {
    paths: (
      <>
        <path d="M3 21c0-2 1-3 2.5-3S8 19 8 20.5 6.5 22 5 21z" />
        <path d="M7.5 18.5 17 9a2.5 2.5 0 0 0-3.5-3.5L4 15" />
        <path d="m14 6 4 4" />
      </>
    ),
  },
  chess: {
    paths: (
      <>
        <path d="M7 21h10" />
        <path d="M8.5 21c0-2 .5-3 1.5-4" />
        <path d="M15.5 21c0-3-1-5-1-7 0-3-2-4-4-4l1-2-2.5-1.5L8 4l3-1.5L13 3c3 0 5 2.5 5 6" />
        <path d="M10.5 8.5h.01" />
      </>
    ),
  },
  yoga: {
    paths: (
      <>
        <circle cx="12" cy="4" r="2" />
        <path d="M12 6.5v4" />
        <path d="M12 10.5 7 13M12 10.5 17 13" />
        <path d="M12 10.5 8.5 18h7z" />
        <path d="M5.5 18.5h13" />
      </>
    ),
  },
  cricket: {
    paths: (
      <>
        <path d="m14 4 6 6-7.5 7.5-6-6z" />
        <path d="m6.5 11.5-2.5 2.5 6 6 2.5-2.5" />
        <circle cx="6" cy="6" r="2.5" />
      </>
    ),
  },
  badminton: {
    paths: (
      <>
        <path d="M12 3 8 9.5h8z" />
        <path d="M10 3.5 12 9M14 3.5 12 9" />
        <path d="M8 9.5c0 3 1.5 5 4 5s4-2 4-5" />
        <path d="M12 14.5V21" />
      </>
    ),
  },
  swimming: {
    paths: (
      <>
        <circle cx="17" cy="6" r="1.8" />
        <path d="m4 11 5-2.5 4 2 3-1.5" />
        <path d="M2.5 16c1.5 0 1.5 1.5 3 1.5s1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5" />
        <path d="M2.5 20c1.5 0 1.5 1.5 3 1.5s1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5 1.5 1.5 3 1.5 1.5-1.5 3-1.5" />
      </>
    ),
  },
  "public-speaking": {
    paths: (
      <>
        <rect x="10" y="2.5" width="4" height="8" rx="2" />
        <path d="M7 9.5a5 5 0 0 0 10 0" />
        <path d="M12 14.5V17" />
        <path d="M8 21h8l-1.5-4h-5z" />
      </>
    ),
  },
};

export function hasSubjectGlyph(slug: string): boolean {
  return slug in SUBJECTS;
}

/**
 * Renders the glyph for a subject.
 *
 * <p>Returns null for a subject with no glyph yet, so the caller can fall back to
 * its category icon rather than showing a hole. With 70 seeded subjects and more
 * to come, an exhaustive map is not a realistic requirement.
 */
export function SubjectGlyph({
  slug,
  className = "h-20 w-20",
}: {
  slug: string;
  className?: string;
}) {
  const glyph = SUBJECTS[slug];
  if (!glyph) return null;

  if ("text" in glyph) {
    // Script characters are set as text: they stay correct at any size, need no
    // path tracing, and a reader of that script finds them more legible than any
    // icon would be.
    return (
      <span
        className={`flex items-center justify-center font-bold leading-none ${className}`}
        style={{ fontSize: "2.75rem" }}
        aria-hidden="true"
      >
        {glyph.text}
      </span>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph.paths}
    </svg>
  );
}
