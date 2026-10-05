/** Supported locales, in canonical order. */
export const locales = ["en", "fr"] as const;

export type AppLocale = (typeof locales)[number];
