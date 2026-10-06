import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/json-ld";
import { isLocale, type AppLocale } from "@/i18n/routing";
import { getCityPage, getDistricts } from "@/lib/city-pages";
import { buildMetadata } from "@/lib/seo";

interface PageProps {
  params: { locale: string; city: string; district: string };
}

export async function generateStaticParams() {
  const districts = await getDistricts("HAIR_SALON", "lyon");
  return districts.map((district) => ({ city: "lyon", district }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = params.locale as AppLocale;
  const page = await getCityPage("HAIR_SALON", params.city, params.district, locale);
  return buildMetadata({
    locale,
    title: page.title,
    description: page.description,
    path: page.path,
  });
}

export default async function Page({ params }: PageProps) {
  if (!isLocale(params.locale)) {
    return null;
  }
  setRequestLocale(params.locale);

  const page = await getCityPage(
    "HAIR_SALON",
    params.city,
    params.district,
    params.locale as AppLocale,
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {page.jsonLd.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}

      <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
      <p className="text-muted-foreground mt-2">{page.description}</p>

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
    </main>
  );
}
