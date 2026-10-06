/**
 * Curated French cities powering the programmatic local-SEO landing pages
 * (`/<locale>/coiffeur/<city>` and `/<locale>/barber/<city>`) and the footer
 * city directory.
 *
 * Pages are generated for every city below even before a salon signs up, so a
 * local search ("coiffeur à Bordeaux") already lands on a useful page instead of
 * a 404. Cities where salons exist are merged in at build time (see
 * `city-pages.ts`), so the directory only ever grows.
 */
export interface SeoCity {
  /** URL slug: lowercase, ASCII, hyphenated. */
  slug: string;
  /** Display name, with correct accents and casing. */
  name: string;
}

export const SEO_CITIES: readonly SeoCity[] = [
  { slug: "paris", name: "Paris" },
  { slug: "marseille", name: "Marseille" },
  { slug: "lyon", name: "Lyon" },
  { slug: "toulouse", name: "Toulouse" },
  { slug: "nice", name: "Nice" },
  { slug: "nantes", name: "Nantes" },
  { slug: "montpellier", name: "Montpellier" },
  { slug: "strasbourg", name: "Strasbourg" },
  { slug: "bordeaux", name: "Bordeaux" },
  { slug: "lille", name: "Lille" },
  { slug: "rennes", name: "Rennes" },
  { slug: "reims", name: "Reims" },
  { slug: "toulon", name: "Toulon" },
  { slug: "saint-etienne", name: "Saint-Étienne" },
  { slug: "le-havre", name: "Le Havre" },
  { slug: "grenoble", name: "Grenoble" },
  { slug: "dijon", name: "Dijon" },
  { slug: "angers", name: "Angers" },
  { slug: "nimes", name: "Nîmes" },
  { slug: "villeurbanne", name: "Villeurbanne" },
  { slug: "clermont-ferrand", name: "Clermont-Ferrand" },
  { slug: "le-mans", name: "Le Mans" },
  { slug: "aix-en-provence", name: "Aix-en-Provence" },
  { slug: "brest", name: "Brest" },
  { slug: "tours", name: "Tours" },
  { slug: "amiens", name: "Amiens" },
  { slug: "limoges", name: "Limoges" },
  { slug: "annecy", name: "Annecy" },
  { slug: "perpignan", name: "Perpignan" },
  { slug: "besancon", name: "Besançon" },
  { slug: "metz", name: "Metz" },
  { slug: "orleans", name: "Orléans" },
  { slug: "rouen", name: "Rouen" },
  { slug: "mulhouse", name: "Mulhouse" },
  { slug: "caen", name: "Caen" },
  { slug: "nancy", name: "Nancy" },
  { slug: "avignon", name: "Avignon" },
  { slug: "poitiers", name: "Poitiers" },
  { slug: "la-rochelle", name: "La Rochelle" },
  { slug: "bayonne", name: "Bayonne" },
  { slug: "pau", name: "Pau" },
  { slug: "ajaccio", name: "Ajaccio" },
  { slug: "cannes", name: "Cannes" },
  { slug: "antibes", name: "Antibes" },
  { slug: "colmar", name: "Colmar" },
  { slug: "troyes", name: "Troyes" },
  { slug: "lorient", name: "Lorient" },
  { slug: "vannes", name: "Vannes" },
] as const;

/** Lowercase ASCII slug for any city name ("Saint-Étienne" → "saint-etienne"). */
export function citySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const NAME_BY_SLUG = new Map(SEO_CITIES.map((city) => [city.slug, city.name]));

/**
 * Sorted, de-duplicated city slugs: the curated SEO list plus any extra city
 * names coming from the database (so a salon outside the list still gets a page).
 */
export function allCitySlugs(extraNames: readonly string[] = []): string[] {
  return [...new Set([...SEO_CITIES.map((city) => city.slug), ...extraNames.map(citySlug)])].sort();
}

/** Display name for a city slug, falling back to a title-cased slug. */
export function cityDisplayName(slug: string): string {
  const known = NAME_BY_SLUG.get(slug);
  if (known) {
    return known;
  }
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}
