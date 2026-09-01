import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Shared UI primitives.
 *
 * Deliberately small and hand-rolled rather than a component library: this is a
 * handful of elements, and a dependency would cost more in bundle size and
 * override-fighting than it saves. Revisit if the surface grows past ~15
 * components.
 */

/* -------------------------------------------------------------------------- */
/* Container                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The single page-width rule. 1200px content, gutters that grow with viewport.
 *
 * Every page uses this rather than setting its own max-width, so vertical edges
 * line up between sections — one of the cheapest things that separates a site
 * that looks designed from one that does not.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[75rem] px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-[var(--shadow-brand)] hover:shadow-lg",
  secondary:
    "bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:ring-ink-300",
  ghost: "text-brand-700 hover:bg-brand-50",
  danger: "bg-danger-600 text-white hover:bg-danger-700",
};

const SIZES: Record<ButtonSize, string> = {
  // Minimum 44px tall at md and above — the touch-target floor. Most of this
  // site's traffic will be a thumb on a mid-range Android phone.
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-base gap-2",
  lg: "h-13 px-7 text-base sm:text-lg gap-2.5",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 " +
  "disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={`${BUTTON_BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}

/** Same visual treatment as Button, but renders a real link — so it is keyboard- and SEO-correct. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link
      className={`${BUTTON_BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Ring rather than border: a ring does not occupy layout space, so cards do not
 * shift by a pixel when they gain a hover state.
 */
export function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-white ring-1 ring-ink-200/80 shadow-xs ${
        interactive
          ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "success" | "neutral" | "warning";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 ring-brand-200",
    success: "bg-success-50 text-success-700 ring-success-600/20",
    neutral: "bg-ink-100 text-ink-600 ring-ink-200",
    warning: "bg-warning-50 text-warning-600 ring-warning-600/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Section heading                                                             */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand-600">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {description && (
        <p className="mt-3 text-lg leading-relaxed text-ink-600">{description}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Inline SVG rather than an icon package: a dozen icons do not justify a
 * dependency, and inlining means no extra network request and no flash of
 * missing glyph.
 *
 * `aria-hidden` throughout — these sit next to real text, so announcing them
 * would only duplicate what a screen reader already reads.
 */
export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: "search" | "check" | "shield" | "location" | "star" | "arrow" | "users" | "wallet" | "menu";
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    check: <path d="m5 13 4 4L19 7" />,
    shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />,
    location: (
      <>
        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5z" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 5.5a3.5 3.5 0 0 1 0 7M17.5 20a6.5 6.5 0 0 0-2-4.7" />
      </>
    ),
    wallet: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1" />
        <path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5.5" />
        <circle cx="16.5" cy="13" r="1.2" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  };

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
      {paths[name]}
    </svg>
  );
}
