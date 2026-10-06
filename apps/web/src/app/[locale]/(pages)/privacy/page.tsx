import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { ContentPage } from "@/components/content-page";
import { isLocale, type AppLocale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo";
import { getSitePage } from "@/lib/site-pages";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as AppLocale;
  const page = getSitePage("privacy")[locale];
  return buildMetadata({
    locale,
    title: page.title,
    description: page.description,
    path: "privacy",
  });
}

export default function Page({ params }: PageProps) {
  if (!isLocale(params.locale)) {
    return null;
  }
  setRequestLocale(params.locale);

  return <ContentPage slug="privacy" locale={params.locale} />;
}
