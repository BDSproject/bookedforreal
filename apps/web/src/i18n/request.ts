import { getRequestConfig } from "next-intl/server";

import { en, fr } from "@bookedforreal/i18n";

import { isLocale, routing } from "./routing";

const messages = { en, fr };

/**
 * Resolves the active locale and loads its messages for the request.
 * Falls back to the default locale when the requested one is unsupported.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: messages[locale],
  };
});
