import Link from "next/link";
import { CategoryIcon, categoryGradient } from "@/components/CategoryIcon";
import { SubjectGlyph, hasSubjectGlyph } from "@/components/SubjectGlyph";

/**
 * A large, image-style tile for one subject.
 *
 * <h2>The glyph is per subject, not per category</h2>
 *
 * The first version drew the category icon on every tile, so Mathematics,
 * Physics, Chemistry, Biology and Science were five identical open books on five
 * identical blue rectangles. The picture carried no information and the label did
 * all the work — which defeats the point of a visual grid.
 *
 * Now: a flask for Chemistry, an atom for Physics, a stethoscope for NEET, and
 * the native script character for each language. A tile only earns its space if
 * it is recognisable before the label is read.
 *
 * <h2>Tone varies within a category too</h2>
 *
 * Five tiles in the identical shade still read as one block of colour. Each tile
 * shifts hue slightly by its position, so a row is recognisably one family while
 * remaining five distinct things.
 *
 * <h2>Why generated rather than photographic</h2>
 *
 * Marketplaces here normally use stock photos, and they do carry more warmth.
 * Against that: seventy photographs is several megabytes on a page whose typical
 * visitor is on a mid-range Android on a patchy connection; every photograph
 * needs a licence traceable to launch; and a stock photo of a smiling student
 * implies a classroom that does not exist yet. If photography is commissioned
 * later, only this component changes.
 */

/**
 * Per-position tone shift within a category row.
 *
 * Written as full literal class strings — Tailwind extracts statically, so a
 * constructed class name produces no CSS at all.
 */
const TONE_SHIFT = [
  "",
  "brightness-105 saturate-[1.15]",
  "brightness-95 saturate-[0.92]",
  "brightness-110 saturate-[1.08]",
  "brightness-90 saturate-[1.2]",
];

export function SubjectTile({
  name,
  slug,
  categorySlug,
  index = 0,
}: {
  name: string;
  slug: string;
  categorySlug: string;
  /** Position within its row; drives the tone shift. */
  index?: number;
}) {
  const tone = TONE_SHIFT[index % TONE_SHIFT.length];

  return (
    <Link href={`/tutors?q=${slug}`} className="group block">
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br ${categoryGradient(categorySlug)} ${tone} shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg`}
      >
        {/* A soft highlight so the tile reads as a lit surface rather than a
            flat swatch of colour. */}
        <div
          className="absolute inset-0 bg-[radial-gradient(120%_90%_at_25%_0%,rgba(255,255,255,0.32),transparent_62%)]"
          aria-hidden="true"
        />

        {/* The subject glyph, large and centred — this is the tile's subject
            matter, so it gets the space rather than being tucked in a corner.
            Falls back to the category icon for subjects without their own. */}
        <div className="absolute inset-0 flex items-center justify-center pb-5 text-white/85">
          {hasSubjectGlyph(slug) ? (
            <SubjectGlyph
              slug={slug}
              className="h-14 w-14 transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <CategoryIcon
              slug={categorySlug}
              className="h-14 w-14 transition-transform duration-300 group-hover:scale-110"
            />
          )}
        </div>

        {/* A gradient scrim so the label stays readable whatever the glyph does
            behind it. */}
        <div
          className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent"
          aria-hidden="true"
        />
        <span className="absolute inset-x-0 bottom-0 p-2.5 text-center text-xs font-semibold leading-snug text-white">
          {name}
        </span>
      </div>

      {/* Repeated below the tile: the one inside sits over a gradient and is
          decorative, this one is plain dark-on-light and is what a scanning eye
          actually reads down the column. */}
      <p className="mt-2 text-center text-sm text-ink-700 transition-colors group-hover:text-brand-700">
        {name}
      </p>
    </Link>
  );
}
