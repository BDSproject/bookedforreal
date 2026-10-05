import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@bookedforreal/db", () => ({
  prisma: { salon: { findMany } },
}));

import { categoryLabel, getCityPage } from "./city-pages";

describe("categoryLabel", () => {
  it("returns the French labels", () => {
    expect(categoryLabel("HAIR_SALON", "fr")).toBe("Coiffeur");
    expect(categoryLabel("BARBER_SHOP", "fr")).toBe("Barbier");
  });

  it("returns the English labels", () => {
    expect(categoryLabel("HAIR_SALON", "en")).toBe("Hairdresser");
    expect(categoryLabel("BARBER_SHOP", "en")).toBe("Barber");
  });
});

describe("getCityPage", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("builds a city landing page with title, description and JSON-LD", async () => {
    findMany.mockResolvedValue([
      { slug: "lyon-brotteaux", name: "Studio Brotteaux", city: "Lyon", district: "Brotteaux", description: "Salon à Lyon" },
    ]);

    const page = await getCityPage("HAIR_SALON", "lyon", undefined, "fr");

    expect(page.title).toBe("Coiffeur Lyon — Bookedforreal");
    expect(page.description).toContain("Lyon");
    expect(page.path).toBe("coiffeur/lyon");
    expect(page.salons).toHaveLength(1);
    expect(page.jsonLd).toHaveLength(3); // BreadcrumbList + FAQPage + ItemList
  });

  it("includes the district in the path and title", async () => {
    findMany.mockResolvedValue([
      { slug: "x", name: "X", city: "Lyon", district: "Brotteaux", description: null },
    ]);

    const page = await getCityPage("HAIR_SALON", "lyon", "brotteaux", "fr");

    expect(page.path).toBe("coiffeur/lyon/brotteaux");
    expect(page.title).toBe("Coiffeur Brotteaux, Lyon — Bookedforreal");
  });

  it("uses the barber slug for BARBER_SHOP", async () => {
    findMany.mockResolvedValue([]);

    const page = await getCityPage("BARBER_SHOP", "paris", undefined, "en");

    expect(page.path).toBe("barber/paris");
    expect(page.title).toBe("Barber Paris — Bookedforreal");
  });
});
