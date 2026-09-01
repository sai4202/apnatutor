import Link from "next/link";
import { CategoryIcon, categoryGradient } from "@/components/CategoryIcon";

/**
 * A large, image-style tile for one subject, with its label beneath.
 *
 * <h2>Why generated tiles rather than photographs</h2>
 *
 * Marketplaces in this category normally use stock photos here, and they do
 * scan well. This uses a generated gradient with the category glyph instead,
 * for three concrete reasons rather than as a stylistic preference:
 *
 * <ul>
 *   <li><strong>Weight.</strong> Seventy stock photos is several megabytes on a
 *       page whose typical visitor is on a mid-range Android on a patchy
 *       connection. These tiles are CSS and one inline SVG — effectively free.
 *   <li><strong>Licensing.</strong> Every photograph needs a licence traceable
 *       to launch. Borrowed stock images are a liability that surfaces later.
 *   <li><strong>Honesty.</strong> A stock photograph of a smiling student
 *       implies a real classroom that does not exist yet. A graphic tile makes
 *       no such claim.
 * </ul>
 *
 * <p>The trade is real: photographs carry more warmth. If photography is
 * commissioned later, only this component changes — the grid around it stays.
 *
 * <p>Each tile inherits its parent category's hue, so subjects within a group
 * read as related and the grid stays navigable by colour.
 */
export function SubjectTile({
  name,
  slug,
  categorySlug,
}: {
  name: string;
  slug: string;
  categorySlug: string;
}) {
  return (
    <Link href={`/tutors?q=${slug}`} className="group block">
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br ${categoryGradient(categorySlug)} shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg`}
      >
        {/* A soft highlight so the tile reads as a lit surface rather than a
            flat swatch of colour. */}
        <div
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_0%,rgba(255,255,255,0.35),transparent_60%)]"
          aria-hidden="true"
        />

        {/* The glyph, oversized and bled off the corner. Cropping it makes the
            tile feel like artwork rather than a centred icon in a box. */}
        <CategoryIcon
          slug={categorySlug}
          className="absolute -bottom-3 -right-3 h-20 w-20 text-white/25 transition-transform duration-300 group-hover:scale-110"
        />

        <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-semibold leading-snug text-white drop-shadow-sm">
          {name}
        </span>
      </div>

      {/* Label repeated below the tile. The one inside sits over a gradient and
          is decorative; this one is plain dark-on-light and is what a scanning
          eye actually reads down the column. */}
      <p className="mt-2 text-center text-sm text-ink-700 transition-colors group-hover:text-brand-700">
        {name}
      </p>
    </Link>
  );
}
