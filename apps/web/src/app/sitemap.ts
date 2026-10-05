import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

/**
 * Generates a sitemap with one entry per locale.
 * The default locale has no URL prefix (`as-needed` routing).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return routing.locales.map((locale) => {
    const path = locale === routing.defaultLocale ? "" : `/${locale}`;
    return {
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
    };
  });
}
