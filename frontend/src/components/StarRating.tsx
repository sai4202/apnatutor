import { Icon } from "@/components/ui";

/**
 * A 1-5 rating, drawn as stars.
 *
 * The number is always rendered as text alongside, not conveyed by the stars
 * alone: five identical glyphs are unreadable to a screen reader and to anyone
 * who cannot distinguish the filled ones from the empty ones. The stars are
 * decorative; the label is the content.
 */
export function StarRating({
  rating,
  size = "sm",
  showNumber = false,
}: {
  rating: number;
  size?: "sm" | "md";
  showNumber?: boolean;
}) {
  const box = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            className={`${box} ${
              star <= Math.round(rating) ? "text-amber-500" : "text-ink-200"
            }`}
          />
        ))}
      </span>
      {showNumber && (
        <span className="font-semibold text-ink-900">{rating.toFixed(1)}</span>
      )}
      <span className="sr-only">{rating.toFixed(1)} out of 5</span>
    </span>
  );
}
