import { Icon } from "@/components/ui";

/**
 * The hero search.
 *
 * A plain GET form, deliberately. It submits to /tutors with query parameters,
 * which means it works with JavaScript disabled, produces a shareable URL, and
 * makes the back button behave — all of which matter for a page whose whole job
 * is to be found through Google.
 *
 * Kept as a Server Component for the same reason: no hydration needed for a form
 * the browser already knows how to submit.
 */
export function SearchBar({
  cities,
  defaultSubject = "",
  defaultCity = "",
}: {
  cities: { slug: string; name: string }[];
  defaultSubject?: string;
  defaultCity?: string;
}) {
  return (
    <form
      action="/tutors"
      method="get"
      className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-ink-200/80 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2.5 px-3">
        <Icon name="search" className="h-5 w-5 shrink-0 text-ink-400" />
        <label htmlFor="q" className="sr-only">
          What do you want to learn?
        </label>
        <input
          id="q"
          name="q"
          type="text"
          defaultValue={defaultSubject}
          placeholder="Maths, Physics, Spoken English, Guitar…"
          className="h-12 w-full min-w-0 bg-transparent text-base text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
      </div>

      <div className="hidden h-8 w-px bg-ink-200 sm:block" />

      <div className="flex items-center gap-2.5 px-3">
        <Icon name="location" className="h-5 w-5 shrink-0 text-ink-400" />
        <label htmlFor="city" className="sr-only">
          City
        </label>
        <select
          id="city"
          name="city"
          defaultValue={defaultCity}
          className="h-12 w-full cursor-pointer bg-transparent text-base text-ink-900 focus:outline-none sm:w-40"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 text-base font-semibold text-white transition-colors hover:bg-brand-700 active:bg-brand-800"
      >
        Search
      </button>
    </form>
  );
}
