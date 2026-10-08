import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { GuidePage } from "@/components/guide-page";
import { isLocale, type AppLocale } from "@/i18n/routing";
import { getGuide } from "@/lib/guide";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as AppLocale;
  const guide = getGuide(locale);
  return buildMetadata({
    locale,
    title: guide.title,
    description: guide.description,
    path: "guide",
  });
}

export default function Page({ params }: PageProps) {
  if (!isLocale(params.locale)) {
    return null;
  }
  setRequestLocale(params.locale);

  return <GuidePage locale={params.locale} />;
}
