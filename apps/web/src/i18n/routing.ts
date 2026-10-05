import { defineRouting } from "next-intl/routing";

/**
 * Locale routing configuration.
 * `as-needed` keeps the default locale (fr) without a URL prefix for clean SEO URLs.
 */
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];

/** Type guard narrowing an arbitrary string to a supported locale. */
export function isLocale(value: string | undefined): value is AppLocale {
  return typeof value === "string" && (routing.locales as readonly string[]).includes(value);
}
