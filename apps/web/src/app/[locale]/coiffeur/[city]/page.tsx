import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@bookedforreal/ui";

import { JsonLd } from "@/components/json-ld";
import { isLocale, type AppLocale } from "@/i18n/routing";
import { SEO_CITIES, cityDisplayName } from "@/lib/cities";
import { categoryLabel, getCities, getCityPage } from "@/lib/city-pages";
import { buildMetadata } from "@/lib/seo";

const CATEGORY = "HAIR_SALON" as const;
const SEGMENT = "coiffeur";

interface PageProps {
  params: { locale: string; city: string };
}

export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as AppLocale;
  const page = await getCityPage(CATEGORY, params.city, undefined, locale);
  // While no salon exists in this city the page is thin: keep it crawlable but
  // out of the index, so it can rank as soon as a salon signs up.
  return buildMetadata({
    locale,
    title: page.title,
    description: page.description,
    path: page.path,
    noindex: page.salons.length === 0,
  });
}

export default async function Page({ params }: PageProps) {
  if (!isLocale(params.locale)) {
    return null;
  }
  setRequestLocale(params.locale);
  const locale = params.locale as AppLocale;
  const t = await getTranslations("city");

  const page = await getCityPage(CATEGORY, params.city, undefined, locale);
  const cityName = cityDisplayName(params.city);
  const label = categoryLabel(CATEGORY, locale);
  const otherCities = SEO_CITIES.filter((city) => city.slug !== params.city);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {page.jsonLd.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}

      <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
      <p className="text-muted-foreground mt-2">{page.description}</p>

      {page.salons.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {page.salons.map((salon) => (
            <li key={salon.slug}>
              <Link
                href={`/${params.locale}/s/${salon.slug}`}
                className="hover:border-primary block rounded-xl border p-4 transition-colors"
              >
                <span className="font-semibold">{salon.name}</span>
                {salon.description ? (
                  <span className="text-muted-foreground mt-1 block text-sm">
                    {salon.description}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-card mt-8 rounded-2xl border p-6">
          <p className="font-semibold">{t("empty", { city: cityName })}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t("emptyHint", { city: cityName })}</p>
          <Button asChild className="mt-5 rounded-full">
            <Link href={`/${params.locale}/register`}>{t("ctaList")}</Link>
          </Button>
        </div>
      )}

      <section className="mt-12 border-t pt-8">
        <h2 className="text-lg font-semibold">{t("otherCities", { label })}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {otherCities.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/${params.locale}/${SEGMENT}/${city.slug}`}
                className="text-muted-foreground hover:border-primary hover:text-primary inline-block rounded-full border px-3 py-1 text-sm transition-colors"
              >
                {city.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
