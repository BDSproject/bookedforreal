import { prisma } from "@bookedforreal/db";

import type { AppLocale } from "@/i18n/routing";

import { breadcrumbJsonLd, faqJsonLd, salonItemListJsonLd } from "./jsonld";
import { siteUrl } from "./seo";

export type SalonCategory = "HAIR_SALON" | "BARBER_SHOP";

const CATEGORY_SLUG: Record<SalonCategory, string> = {
  HAIR_SALON: "coiffeur",
  BARBER_SHOP: "barber",
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function categoryLabel(category: SalonCategory, locale: AppLocale): string {
  if (locale === "fr") {
    return category === "HAIR_SALON" ? "Coiffeur" : "Barbier";
  }
  return category === "HAIR_SALON" ? "Hairdresser" : "Barber";
}

/** Distinct lowercase cities for a category (used by generateStaticParams). */
export async function getCities(category: SalonCategory): Promise<string[]> {
  const rows = await prisma.salon.findMany({
    where: { type: category, city: { not: null } },
    distinct: ["city"],
    select: { city: true },
  });
  return [...new Set(rows.map((r) => r.city!.toLowerCase()))];
}

/** Distinct lowercase districts for a category + city. */
export async function getDistricts(category: SalonCategory, city: string): Promise<string[]> {
  const rows = await prisma.salon.findMany({
    where: { type: category, city: { equals: city, mode: "insensitive" }, district: { not: null } },
    distinct: ["district"],
    select: { district: true },
  });
  return [...new Set(rows.map((r) => r.district!.toLowerCase()))];
}

export interface CityPageData {
  salons: { slug: string; name: string; city: string | null; district: string | null; description: string | null }[];
  title: string;
  description: string;
  path: string;
  jsonLd: Record<string, unknown>[];
}

/** Builds everything needed to render a city/district SEO landing page. */
export async function getCityPage(
  category: SalonCategory,
  city: string,
  district: string | undefined,
  locale: AppLocale,
): Promise<CityPageData> {
  const salons = await prisma.salon.findMany({
    where: {
      type: category,
      city: { equals: city, mode: "insensitive" },
      ...(district ? { district: { equals: district, mode: "insensitive" } } : {}),
    },
    select: { slug: true, name: true, city: true, district: true, description: true },
  });

  const slug = CATEGORY_SLUG[category];
  const cityTitle = capitalize(city);
  const districtTitle = district ? capitalize(district) : null;
  const place = districtTitle ? `${districtTitle}, ${cityTitle}` : cityTitle;
  const label = categoryLabel(category, locale);

  const title = `${label} ${place}`;
  const description =
    locale === "fr"
      ? `Réservez votre ${label.toLowerCase()} à ${place} en ligne. Disponibilités en temps réel et confirmation immédiate.`
      : `Book your ${label.toLowerCase()} in ${place} online. Real-time availability and instant confirmation.`;

  const path = district ? `${slug}/${city}/${district}` : `${slug}/${city}`;
  const base = `${siteUrl()}/${locale}`;

  const breadcrumbItems = [
    { name: "Bookedforreal", url: base },
    { name: cityTitle, url: `${base}/${slug}/${city}` },
    ...(districtTitle ? [{ name: districtTitle, url: `${base}/${slug}/${city}/${district}` }] : []),
  ];

  const faq = faqJsonLd([
    {
      question: `Comment réserver un ${label.toLowerCase()} à ${place} ?`,
      answer: `Choisissez un salon, un service et un créneau, puis confirmez avec vos coordonnées. C'est fait en 3 clics.`,
    },
    {
      question: `Puis-je annuler ou modifier mon rendez-vous ?`,
      answer: `Oui, vous pouvez annuler ou reporter votre rendez-vous depuis l'email de confirmation.`,
    },
  ]);

  const itemList = salonItemListJsonLd(
    salons.map((s) => ({ name: s.name, url: `${base}/s/${s.slug}` })),
  );

  return {
    salons,
    title: `${title} — Bookedforreal`,
    description,
    path,
    jsonLd: [breadcrumbJsonLd(breadcrumbItems), faq, itemList],
  };
}
