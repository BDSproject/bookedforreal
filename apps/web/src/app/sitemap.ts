import type { MetadataRoute } from "next";

import { prisma } from "@bookedforreal/db";

import { routing } from "@/i18n/routing";
import { allCitySlugs } from "@/lib/cities";

/** Category URL segments that get a landing page per city. */
const CITY_SEGMENTS = ["coiffeur", "barber"] as const;

/**
 * Dynamic sitemap: home, salon mini-sites and the local-SEO city landing pages
 * (curated city directory + every city where a salon already exists), per locale.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [salons, cityRows] = await Promise.all([
    prisma.salon.findMany({ select: { slug: true } }),
    prisma.salon.findMany({
      where: { city: { not: null } },
      distinct: ["city"],
      select: { city: true },
    }),
  ]);

  const citySlugs = allCitySlugs(cityRows.map((row) => row.city!));

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    });

    for (const salon of salons) {
      entries.push({
        url: `${baseUrl}/${locale}/s/${salon.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const city of citySlugs) {
      for (const segment of CITY_SEGMENTS) {
        entries.push({
          url: `${baseUrl}/${locale}/${segment}/${city}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  }

  return entries;
}
