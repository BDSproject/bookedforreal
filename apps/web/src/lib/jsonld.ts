/**
 * Schema.org JSON-LD builders for local SEO.
 * See https://schema.org/HairSalon, https://schema.org/BarberShop,
 * https://schema.org/LocalBusiness, https://schema.org/FAQPage,
 * https://schema.org/BreadcrumbList.
 */

type JsonLd = Record<string, unknown>;

const DAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/** Minimal salon shape required to build structured data. */
export interface SalonSeo {
  name: string;
  description: string | null;
  slug: string;
  type: "HAIR_SALON" | "BARBER_SHOP";
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  availabilities: { weekday: number; startTime: string; endTime: string }[];
  services: { nameFr: string; nameEn: string; priceCents: number; durationMin: number }[];
  reviews: { rating: number }[];
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

function withContext<T extends Record<string, unknown>>(data: T): JsonLd {
  return { "@context": "https://schema.org", ...data };
}

/** Converts weekly availability into Schema.org OpeningHoursSpecification. */
export function openingHoursSpecification(
  availabilities: { weekday: number; startTime: string; endTime: string }[],
): JsonLd[] {
  return availabilities.map((a) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: DAY_SHORT[a.weekday],
    opens: a.startTime,
    closes: a.endTime,
  }));
}

/** HairSalon / BarberShop (subtypes of LocalBusiness). */
export function salonJsonLd(salon: SalonSeo, url: string): JsonLd {
  const salonType = salon.type === "BARBER_SHOP" ? "BarberShop" : "HairSalon";

  const makesOffer = salon.services.map((s) => ({
    "@type": "Offer",
    name: s.nameFr,
    description: s.nameEn,
    price: (s.priceCents / 100).toFixed(2),
    priceCurrency: "EUR",
    timeRequired: `PT${s.durationMin}M`,
  }));

  return withContext({
    "@type": salonType,
    "@id": `${url}#salon`,
    name: salon.name,
    description: salon.description ?? undefined,
    url,
    image: salon.logoUrl ?? undefined,
    telephone: salon.phone ?? undefined,
    email: salon.email ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: salon.address ?? undefined,
      addressLocality: salon.city ?? undefined,
      postalCode: salon.postalCode ?? undefined,
      addressCountry: salon.country,
    },
    openingHoursSpecification: openingHoursSpecification(salon.availabilities),
    priceRange: "€€",
    ...(makesOffer.length > 0 ? { makesOffer } : {}),
    ...(salon.reviews.length > 0 ? { aggregateRating: aggregateRating(salon.reviews) } : {}),
  });
}

export function aggregateRating(reviews: { rating: number }[]): JsonLd {
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return {
    "@type": "AggregateRating",
    ratingValue: (sum / reviews.length).toFixed(1),
    reviewCount: reviews.length,
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLd {
  return withContext({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

export function faqJsonLd(questions: { question: string; answer: string }[]): JsonLd {
  return withContext({
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  });
}

/** SoftwareApplication (landing page) with Starter/Pro offers. */
export function softwareApplicationJsonLd(url: string, offers: { name: string; price: string }[]): JsonLd {
  return withContext({
    "@type": "SoftwareApplication",
    name: "Bookedforreal",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url,
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: 120 },
    offers: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      price: offer.price,
      priceCurrency: "EUR",
    })),
  });
}

/** Article (blog post). */
export function articleJsonLd(input: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  author?: string;
}): JsonLd {
  return withContext({
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: input.url,
    datePublished: input.datePublished,
    author: { "@type": "Organization", name: input.author ?? "Bookedforreal" },
    publisher: { "@type": "Organization", name: "Bookedforreal" },
  });
}

/** ItemList of salons, used on city/district landing pages. */
export function salonItemListJsonLd(items: { name: string; url: string }[]): JsonLd {
  return withContext({
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  });
}

/** Organization entity — powers the brand knowledge panel. */
export function organizationJsonLd(url: string): JsonLd {
  return withContext({
    "@type": "Organization",
    name: "Bookedforreal",
    url,
    logo: `${url}/logo-mark.png`,
  });
}

/** WebSite entity — helps Google understand the site and its locale alternates. */
export function websiteJsonLd(url: string): JsonLd {
  return withContext({
    "@type": "WebSite",
    name: "Bookedforreal",
    url,
  });
}
