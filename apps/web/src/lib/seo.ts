import type { Metadata } from "next";

import { routing, type AppLocale } from "@/i18n/routing";

const SITE_NAME = "Bookedforreal";

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Builds hreflang + x-default + canonical `alternates` for a page. */
export function hreflangAlternates(locale: AppLocale, pathname = ""): NonNullable<Metadata["alternates"]> {
  const base = (l: string): string => `/${l}${pathname ? `/${pathname}` : ""}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = base(l);
  }
  languages["x-default"] = base(routing.defaultLocale);

  return { canonical: base(locale), languages };
}

export interface BuildMetadataInput {
  locale: AppLocale;
  title: string;
  description: string;
  /** Relative path WITHOUT leading slash, e.g. "s/paris-marais". */
  path: string;
  image?: string;
  /**
   * Keeps the page crawlable but out of the index. Used for thin pages (e.g. a
   * city without any salon yet) to avoid scaled/thin-content issues.
   */
  noindex?: boolean;
}

/** Builds full page metadata: title, description, OpenGraph, Twitter, canonical + hreflang. */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const url = `${siteUrl()}/${input.locale}/${input.path}`;
  const ogImage = input.image ? { images: [{ url: input.image }] } : undefined;

  return {
    title: input.title,
    description: input.description,
    alternates: hreflangAlternates(input.locale, input.path),
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: input.locale === "fr" ? "fr_FR" : "en_US",
      ...ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      ...ogImage,
    },
    ...(input.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
