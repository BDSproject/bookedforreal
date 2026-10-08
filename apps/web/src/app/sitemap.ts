import type { MetadataRoute } from "next";

import { prisma } from "@bookedforreal/db";

import { routing } from "@/i18n/routing";
import { citySlug } from "@/lib/cities";

/**
 * Trust / legal pages (same slug for every locale). They are cheap, permanent
 * pages, so they are declared with a low `monthly` change frequency.
 */
const STATIC_PAGES = ["about", "contact", "legal", "privacy", "terms"] as const;

/**
 * Dynamic sitemap: home, trust pages, salon mini-sites and the city landing
 * pages **that actually have a salon** (cities without a salon are noindexed, so
 * they are deliberately left out of the sitemap).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [salons, cityRows] = await Promise.all([
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

    for (const page of STATIC_PAGES) {
      entries.push({
        url: `${baseUrl}/${locale}/${page}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    // The setup guide is a marketing page: it answers "how long does it take?".
    entries.push({
      url: `${baseUrl}/${locale}/guide`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });

    for (const salon of salons) {
      entries.push({
        url: `${baseUrl}/${locale}/s/${salon.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const row of cityRows) {
      const segment = row.type === "BARBER_SHOP" ? "barber" : "coiffeur";
      entries.push({
        url: `${baseUrl}/${locale}/${segment}/${citySlug(row.city!)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
