import type { MetadataRoute } from "next";

/**
 * robots.txt.
 *
 * <p>The disallow list is not about secrecy — those routes are protected by the
 * backend regardless. It is about crawl budget and index quality: a crawler that
 * spends its visits on login redirects and dashboards is not spending them on the
 * city × subject pages that actually bring visitors.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Authenticated areas. Nothing here renders for a crawler anyway — it
        // would only ever see the login redirect.
        "/tutor/",
        "/student/",
        "/admin/",
        "/login",
        // The API is not a set of pages. Letting a crawler walk it wastes crawl
        // budget on JSON and can look like scraping.
        "/api/",
      ],
    },
    sitemap: "https://apnatutor.in/sitemap.xml",
  };
}
