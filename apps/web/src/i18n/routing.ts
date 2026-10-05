import { defineRouting } from "next-intl/routing";

import { locales } from "@bookedforreal/i18n";

/**
 * Locale routing configuration.
 * `always` prefixes every URL with the locale: /fr/... and /en/...
 * The locale preference is persisted in the `NEXT_LOCALE` cookie by the middleware.
 */
export const routing = defineRouting({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

/** Type guard narrowing an arbitrary string to a supported locale. */
export function isLocale(value: string | undefined): value is AppLocale {
  return typeof value === "string" && (routing.locales as readonly string[]).includes(value);
}
