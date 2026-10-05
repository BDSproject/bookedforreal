import type { MetadataRoute } from "next";

import { prisma } from "@bookedforreal/db";
import { routing } from "@/i18n/routing";

/**
 * Dynamic sitemap: home, salon mini-sites and city landing pages for every locale.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [salons, cities] = await Promise.all([
    prisma.salon.findMany({ select: { slug: true } }),
    prisma.salon.findMany({
      where: { city: { not: null } },
      distinct: ["city", "type"],
      select: { city: true, type: true },
    }),
  ]);

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

    for (const city of cities) {
      const category = city.type === "BARBER_SHOP" ? "barber" : "coiffeur";
      entries.push({
        url: `${baseUrl}/${locale}/${category}/${city.city!.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
