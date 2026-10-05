import { I18n } from "i18n-js";

import { translations } from "./messages";

export type AppLocale = "fr" | "en";

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.locale = "fr";

/** Switches the active locale (persisted by the caller). */
export function setLocale(locale: AppLocale): void {
  i18n.locale = locale;
}

export function getLocale(): AppLocale {
  return i18n.locale as AppLocale;
}

/** Translate a dot-separated key, e.g. t("booking.title"). */
export function t(key: string): string {
  return i18n.t(key);
}

export { i18n };
