import { describe, expect, it } from "vitest";

import { buildMetadata, hreflangAlternates } from "./seo";

describe("hreflangAlternates", () => {
  it("returns canonical + fr/en + x-default for the home page", () => {
    const alternates = hreflangAlternates("fr");

    expect(alternates.canonical).toBe("/fr");
    expect(alternates.languages).toEqual({
      fr: "/fr",
      en: "/en",
      "x-default": "/fr",
    });
  });

  it("prefixes a nested path", () => {
    const alternates = hreflangAlternates("en", "s/paris-marais");

    expect(alternates.canonical).toBe("/en/s/paris-marais");
    expect(alternates.languages?.["x-default"]).toBe("/fr/s/paris-marais");
  });
});

describe("buildMetadata", () => {
  it("builds title, description, OG and Twitter", () => {
    const metadata = buildMetadata({
      locale: "fr",
      title: "Coiffeur Lyon",
      description: "Réservez un coiffeur à Lyon",
      path: "coiffeur/lyon",
    });

    expect(metadata.title).toBe("Coiffeur Lyon");
    expect(metadata.description).toBe("Réservez un coiffeur à Lyon");
    expect(metadata.openGraph?.title).toBe("Coiffeur Lyon");
    expect(metadata.openGraph?.description).toBe("Réservez un coiffeur à Lyon");
    expect(metadata.twitter?.title).toBe("Coiffeur Lyon");
    expect(metadata.alternates?.canonical).toBe("/fr/coiffeur/lyon");
  });

  it("sets the locale-specific OG locale", () => {
    const fr = buildMetadata({ locale: "fr", title: "T", description: "D", path: "" });
    const en = buildMetadata({ locale: "en", title: "T", description: "D", path: "" });

    expect(fr.openGraph?.locale).toBe("fr_FR");
    expect(en.openGraph?.locale).toBe("en_US");
  });
});
