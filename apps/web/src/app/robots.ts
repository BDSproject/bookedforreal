import type { MetadataRoute } from "next";

/**
 * robots.txt controls **crawling** only — not indexing.
 *
 * Google's developer guide: "A robots.txt is not a mechanism for keeping a web
 * page out of Google. To keep a web page out of Google, use the `noindex` robots
 * rules, or password-protect your page." It also warns that combining crawling
 * and indexing rules can make them counteract each other: a `Disallow`ed URL is
 * never fetched, so Google never sees its `noindex` — and the URL can still be
 * indexed (URL-only) when it is linked from elsewhere.
 *
 * We therefore allow crawling everywhere and de-index private / thin pages with
 * a `noindex` meta tag instead:
 *   - (auth) and (dashboard) route groups  → noindex, nofollow
 *   - the booking flow and empty city pages → noindex, follow
 *
 * The site has no GET state-changing URLs, so nothing needs to be blocked.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
