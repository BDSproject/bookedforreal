import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

/**
 * Generates a sitemap with one entry per locale (URLs are locale-prefixed).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return routing.locales.map((locale) => ({
    url: `${baseUrl}/${locale}`,
    lastModified: new Date(),
  }));
}
