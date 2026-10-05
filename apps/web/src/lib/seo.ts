import type { Metadata } from "next";

import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Builds hreflang + x-default + canonical `alternates` for a page.
 * `pathname` is relative WITHOUT a leading slash (e.g. "" for the home page,
 * "salons/my-salon" for a salon page).
 */
export function hreflangAlternates(locale: AppLocale, pathname = ""): Metadata["alternates"] {
  const base = (l: string): string => `/${l}${pathname ? `/${pathname}` : ""}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = base(l);
  }
  languages["x-default"] = base(routing.defaultLocale);

  return { canonical: base(locale), languages };
}
