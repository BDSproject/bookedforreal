import { describe, expect, it } from "vitest";

import {
  aggregateRating,
  breadcrumbJsonLd,
  faqJsonLd,
  openingHoursSpecification,
  salonJsonLd,
  salonItemListJsonLd,
  type SalonSeo,
} from "./jsonld";

const salon: SalonSeo = {
  name: "Barber Shop Marais",
  description: "Barber shop in Paris",
  slug: "paris-marais",
  type: "BARBER_SHOP",
  address: "12 rue des Archives",
  city: "Paris",
  postalCode: "75004",
  country: "FR",
  phone: "+33123456789",
  email: "hello@salon.fr",
  logoUrl: null,
  availabilities: [{ weekday: 1, startTime: "09:00", endTime: "18:00" }],
  services: [{ nameFr: "Coupe", nameEn: "Haircut", priceCents: 2500, durationMin: 30 }],
  reviews: [{ rating: 5 }, { rating: 4 }],
};

describe("salonJsonLd", () => {
  it("emits a BarberShop for a BARBER_SHOP salon", () => {
    const ld = salonJsonLd(salon, "https://example.com/fr/s/paris-marais");
    expect(ld["@type"]).toBe("BarberShop");
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["name"]).toBe("Barber Shop Marais");
  });

  it("emits a HairSalon for a HAIR_SALON salon", () => {
    const ld = salonJsonLd({ ...salon, type: "HAIR_SALON" }, "https://example.com");
    expect(ld["@type"]).toBe("HairSalon");
  });

  it("includes opening hours, offers and aggregate rating", () => {
    const ld = salonJsonLd(salon, "https://example.com");
    expect(ld["openingHoursSpecification"]).toHaveLength(1);
    expect(ld["makesOffer"]).toHaveLength(1);
    expect(ld["aggregateRating"]).toEqual({ "@type": "AggregateRating", ratingValue: "4.5", reviewCount: 2 });
  });
});

describe("openingHoursSpecification", () => {
  it("maps weekday 0-6 to Schema.org day names", () => {
    const spec = openingHoursSpecification([{ weekday: 1, startTime: "09:00", endTime: "18:00" }]);
    expect(spec[0]).toEqual({ "@type": "OpeningHoursSpecification", dayOfWeek: "Mo", opens: "09:00", closes: "18:00" });
  });
});

describe("breadcrumbJsonLd", () => {
  it("builds a BreadcrumbList with positions", () => {
    const ld = breadcrumbJsonLd([
      { name: "Home", url: "/fr" },
      { name: "Salon", url: "/fr/s/x" },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld["itemListElement"]).toHaveLength(2);
  });
});

describe("faqJsonLd", () => {
  it("builds a FAQPage", () => {
    const ld = faqJsonLd([{ question: "Q?", answer: "A." }]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld["mainEntity"]).toHaveLength(1);
  });
});

describe("salonItemListJsonLd", () => {
  it("builds an ItemList", () => {
    const ld = salonItemListJsonLd([{ name: "A", url: "/s/a" }]);
    expect(ld["@type"]).toBe("ItemList");
  });
});

describe("aggregateRating", () => {
  it("computes the average", () => {
    expect(aggregateRating([{ rating: 5 }, { rating: 3 }])).toEqual({
      "@type": "AggregateRating",
      ratingValue: "4.0",
      reviewCount: 2,
    });
  });
});
