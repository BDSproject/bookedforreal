import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { prisma } from "@bookedforreal/db";
import { Button } from "@bookedforreal/ui";

import { JsonLd } from "@/components/json-ld";
import { isLocale, type AppLocale } from "@/i18n/routing";
import { breadcrumbJsonLd, salonJsonLd } from "@/lib/jsonld";
import { buildMetadata, siteUrl } from "@/lib/seo";
import { groupServices } from "@/lib/service-groups";
import { hasAccess } from "@/lib/trial";

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
      services: {
        where: { active: true },
        include: { category: true },
        orderBy: [{ category: { order: "asc" } }, { nameFr: "asc" }],
      },
      staff: { where: { active: true } },
      availabilities: true,
      reviews: true,
      subscription: { select: { status: true } },
    },
  });
  if (!salon) {
    notFound();
  }

  // Trial over and no subscription → the salon's booking flow is closed.
  const bookingEnabled = hasAccess({
    trialEndsAt: salon.trialEndsAt,
    subscriptionStatus: salon.subscription?.status ?? null,
  });

  const t = await getTranslations({ locale, namespace: "booking" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const url = `${siteUrl()}/${locale}/s/${salon.slug}`;
  const categorySlug = salon.type === "BARBER_SHOP" ? "barber" : "coiffeur";

  const jsonLd = salonJsonLd(salon, url, { bookingEnabled });
  const breadcrumb = breadcrumbJsonLd([
    { name: "Bookedforreal", url: `${siteUrl()}/${locale}` },
    {
      name: salon.city ?? "",
      url: `${siteUrl()}/${locale}/${categorySlug}/${salon.city?.toLowerCase()}`,
    },
    { name: salon.name, url },
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumb} />

      <h1 className="text-3xl font-bold tracking-tight">{salon.name}</h1>
      <p className="text-muted-foreground mt-2">{salon.description}</p>
      {salon.address ? (
        <p className="text-muted-foreground mt-1 text-sm">
          {salon.address}, {salon.postalCode} {salon.city}
        </p>
      ) : null}

      <section className="mt-10" aria-labelledby="services-heading">
        <h2 id="services-heading" className="text-xl font-semibold">
          {t("service.label")}
        </h2>

        {/* Grouped into price-list sections; `groupServices` keeps them in order. */}
        {groupServices(salon.services).map((group) => (
          <div key={group.category?.id ?? "ungrouped"} className="mt-6">
            <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
              {group.category?.name ?? t("service.other")}
            </h3>
            <ul className="mt-3 space-y-3">
              {group.services.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <span className="font-medium">
                    {locale === "fr" ? service.nameFr : service.nameEn}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {service.durationMin} min · {(service.priceCents / 100).toFixed(2)} €
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-10" aria-labelledby="staff-heading">
        <h2 id="staff-heading" className="text-xl font-semibold">
          {t("staff.label")}
        </h2>
        <p className="text-muted-foreground mt-2">{salon.staff.map((s) => s.name).join(", ")}</p>
      </section>

      {bookingEnabled ? (
        <Button asChild size="xl" className="mt-10 rounded-full px-10">
          <Link href={`/${locale}/s/${salon.slug}/book`}>{tc("nav.book")}</Link>
        </Button>
      ) : (
        <div className="bg-card mt-10 rounded-2xl border p-6">
          <p className="font-semibold">{t("unavailable")}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t("unavailableHint")}</p>
        </div>
      )}
    </main>
  );
}
