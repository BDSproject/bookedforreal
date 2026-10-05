import { getRequestConfig } from "next-intl/server";

import en from "@bookedforreal/i18n/messages/en.json";
import fr from "@bookedforreal/i18n/messages/fr.json";

import { isLocale, routing } from "./routing";

const messages = { en, fr };

/**
 * Resolves the active locale and loads its JSON message catalog.
 * Falls back to the default locale when the requested one is unsupported.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    // The FR/EN catalogs are structurally identical; cast to collapse the union.
    messages: messages[locale] as typeof en,
  };
});
