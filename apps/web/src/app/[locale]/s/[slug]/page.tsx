import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { prisma } from "@bookedforreal/db";
import { Button } from "@bookedforreal/ui";

import { JsonLd } from "@/components/json-ld";
import { isLocale, type AppLocale } from "@/i18n/routing";
import { breadcrumbJsonLd, salonJsonLd } from "@/lib/jsonld";
import { buildMetadata, siteUrl } from "@/lib/seo";

interface SalonPageProps {
  params: { locale: string; slug: string };
}

export async function generateStaticParams() {
  const salons = await prisma.salon.findMany({ select: { slug: true } });
  return salons.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: SalonPageProps): Promise<Metadata> {
  const locale = params.locale as AppLocale;
  const salon = await prisma.salon.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true },
  });
  if (!salon) {
    return {};
  }

  return buildMetadata({
    locale,
    title: `${salon.name} — ${locale === "fr" ? "Réservez en ligne" : "Book online"}`,
    description: salon.description ?? "",
    path: `s/${params.slug}`,
    image: `${siteUrl()}/${locale}/s/${params.slug}/opengraph-image`,
  });
}

export default async function SalonPage({ params }: SalonPageProps) {
  const { locale, slug } = params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const salon = await prisma.salon.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true } },
      staff: { where: { active: true } },
      availabilities: true,
      reviews: true,
    },
  });
  if (!salon) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "booking" });
  const url = `${siteUrl()}/${locale}/s/${salon.slug}`;
  const categorySlug = salon.type === "BARBER_SHOP" ? "barber" : "coiffeur";

  const jsonLd = salonJsonLd(salon, url);
  const breadcrumb = breadcrumbJsonLd([
    { name: "Bookedforreal", url: `${siteUrl()}/${locale}` },
    { name: salon.city ?? "", url: `${siteUrl()}/${locale}/${categorySlug}/${salon.city?.toLowerCase()}` },
    { name: salon.name, url },
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumb} />

      <h1 className="text-3xl font-bold tracking-tight">{salon.name}</h1>
      <p className="mt-2 text-muted-foreground">{salon.description}</p>
      {salon.address ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {salon.address}, {salon.postalCode} {salon.city}
        </p>
      ) : null}

      <h2 className="mt-10 text-xl font-semibold">{t("service.label")}</h2>
      <ul className="mt-4 space-y-3">
        {salon.services.map((service) => (
          <li key={service.id} className="flex items-center justify-between rounded-xl border p-4">
            <span className="font-medium">{locale === "fr" ? service.nameFr : service.nameEn}</span>
            <span className="text-sm text-muted-foreground">
              {service.durationMin} min · {(service.priceCents / 100).toFixed(2)} €
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold">{t("staff.label")}</h2>
      <p className="mt-2 text-muted-foreground">{salon.staff.map((s) => s.name).join(", ")}</p>

      <Button size="xl" className="mt-10 px-12">
        {t("confirm")}
      </Button>
    </main>
  );
}
