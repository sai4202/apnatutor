import type { MetadataRoute } from "next";
import { fetchCities, fetchLeafSubjects } from "@/lib/api";

/**
 * The sitemap.
 *
 * <p>Generated from the live catalog rather than hardcoded, so a subject or city
 * added to the database appears here without anyone remembering to update a list.
 *
 * <p><strong>City × subject pages are the reason this exists.</strong> Ten cities
 * and seventy subjects is seven hundred pages, and they are the primary
 * acquisition channel — but they are also mostly unlinked from the main
 * navigation, so without a sitemap a crawler would find them only by following
 * the related-links block on each one. That works eventually; a sitemap makes it
 * happen in days rather than months.
 *
 * <p>Note this lists every combination, including ones with no tutors yet. That
 * is deliberate and safe: those pages carry `noindex` in their own metadata
 * (M2-08.4), so being listed here invites a crawl without risking a thin-content
 * penalty. Listing them means the page is already indexed the moment its first
 * tutor publishes, rather than waiting for a recrawl.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://apnatutor.in";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/tutors`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/post-requirement`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/for-tutors`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const [cities, subjects] = await Promise.all([
    fetchCities(),
    fetchLeafSubjects(),
  ]);

  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${base}/tutors/${city.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const combinationPages: MetadataRoute.Sitemap = cities.flatMap((city) =>
    subjects.map((subject) => ({
      url: `${base}/tutors/${city.slug}/${subject.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      // Below the city pages: a city page is useful to more visitors than any
      // single subject within it, and priority is a relative hint about which
      // pages matter most on this site.
      priority: 0.6,
    })),
  );

  return [...staticPages, ...cityPages, ...combinationPages];
}
