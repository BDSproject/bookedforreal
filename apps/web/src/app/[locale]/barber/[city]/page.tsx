import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/json-ld";
import { isLocale, type AppLocale } from "@/i18n/routing";
import { getCities, getCityPage } from "@/lib/city-pages";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: { locale: string; city: string };
}

export async function generateStaticParams() {
  const cities = await getCities("BARBER_SHOP");
  return cities.map((city) => ({ city }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as AppLocale;
  const page = await getCityPage("BARBER_SHOP", params.city, undefined, locale);
  return buildMetadata({ locale, title: page.title, description: page.description, path: page.path });
}

export default async function Page({ params }: PageProps) {
  if (!isLocale(params.locale)) {
    return null;
  }
  setRequestLocale(params.locale);

  const page = await getCityPage("BARBER_SHOP", params.city, undefined, params.locale as AppLocale);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {page.jsonLd.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}

      <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
      <p className="mt-2 text-muted-foreground">{page.description}</p>

      <ul className="mt-8 space-y-4">
        {page.salons.map((salon) => (
          <li key={salon.slug}>
            <Link href={`/${params.locale}/s/${salon.slug}`} className="block rounded-xl border p-4 transition-colors hover:border-primary">
              <span className="font-semibold">{salon.name}</span>
              {salon.description ? <span className="mt-1 block text-sm text-muted-foreground">{salon.description}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
