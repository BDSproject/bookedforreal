import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { prisma } from "@bookedforreal/db";
import { Button } from "@bookedforreal/ui";

import {
  ArrowDownIcon,
  BrowserIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  PhoneIcon,
} from "@/components/icons";
import { DemoForm } from "@/components/landing/demo-form";
import { Pricing } from "@/components/landing/pricing";
import { JsonLd } from "@/components/json-ld";
import { Link as AppLink } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { allCitySlugs, cityDisplayName } from "@/lib/cities";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/jsonld";
import { siteUrl } from "@/lib/seo";

const STEPS = [1, 2, 3] as const;
/** Features paired with their stroke-drawn SVG icon (no emoji, so the page feels designed). */
const FEATURES = [
  { key: 1, Icon: BrowserIcon },
  { key: 2, Icon: CalendarIcon },
  { key: 3, Icon: ChatIcon },
  { key: 4, Icon: PhoneIcon },
] as const;
const TESTIMONIALS = [1, 2, 3] as const;
const FAQ_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const HERO_POINTS = [1, 2, 3, 4] as const;
const HERO_TRUST = [1, 2, 3, 4] as const;
const MOCK_SERVICES = [1, 2, 3] as const;
const MOCK_TIMES = ["45 min", "30 min", "1 h 30"] as const;
const MOCK_PRICES = ["35 €", "25 €", "70 €"] as const;

/** Footer city directory: one landing page per category for every SEO city. */
const CITY_DIRS = [
  { segment: "coiffeur", label: "footer.hairdressers" },
  { segment: "barber", label: "footer.barbers" },
] as const;

/** Trust / legal pages linked from the footer (E-E-A-T + legal requirements). */
const COMPANY_LINKS = [
  { href: "/guide", label: "footer.guide" },
  { href: "/about", label: "footer.about" },
  { href: "/contact", label: "footer.contact" },
  { href: "/legal", label: "footer.legal" },
  { href: "/privacy", label: "footer.privacy" },
  { href: "/terms", label: "footer.terms" },
] as const;

interface HomePageProps {
  params: { locale: string };
}

export default async function HomePage({ params }: HomePageProps) {
  const locale = params.locale;
  if (!isLocale(locale)) {
    return null;
  }
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "home" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const url = `${siteUrl()}/${locale}`;

  const cities = await prisma.salon.findMany({
    where: { city: { not: null } },
    distinct: ["city"],
    select: { city: true },
  });

  // Curated SEO cities + any city where a salon already exists.
  const citySlugs = allCitySlugs(cities.map((city) => city.city!));

  const software = softwareApplicationJsonLd(url, [
    { name: "Usage", price: "0" },
    { name: "Solo", price: "19" },
    { name: "Salon", price: "39" },
  ]);

  return (
    <div className="bg-background">
      <JsonLd data={organizationJsonLd(siteUrl())} />
      <JsonLd data={websiteJsonLd(siteUrl())} />
      <JsonLd data={software} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Bookedforreal", url }])} />

      {/* 1. Hero */}
      <section className="border-border/60 relative overflow-hidden border-b">
        <div
          aria-hidden
          className="from-accent/45 via-background to-background pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b"
        />
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
          <div>
            <h1 className="font-display text-navy text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl xl:text-[3.4rem]">
              {t("hero.title")}
              <br className="hidden sm:block" />{" "}
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="text-muted-foreground mt-6 max-w-xl text-[1.0625rem] leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <ul className="mt-8 space-y-3">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckIcon className="text-primary mt-0.5 h-[18px] w-[18px] shrink-0" />
                  <span className="text-foreground/90 text-[15px]">
                    {t(`hero.points.${point}`)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button asChild size="xl" className="rounded-full px-8">
                <AppLink href="/register">{t("hero.cta")}</AppLink>
              </Button>
              <a
                href="#demo"
                className="text-foreground/80 hover:text-primary inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                {t("hero.secondary")}
                <ArrowDownIcon className="h-4 w-4" />
              </a>
            </div>

            <div className="border-border/70 text-muted-foreground mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-6 text-sm">
              {HERO_TRUST.map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckIcon className="text-primary h-4 w-4" />
                  {t(`hero.trust.${item}`)}
                </span>
              ))}
            </div>
          </div>

          {/* Booking card mockup */}
          <div className="mx-auto w-full max-w-md">
            <div className="border-border/70 bg-card shadow-primary/10 rounded-[1.75rem] border p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-full">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-[1.05rem] font-semibold leading-tight">
                    {t("mockup.salonName")}
                  </p>
                  <p className="text-muted-foreground text-xs">{t("mockup.address")}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {MOCK_SERVICES.map((service) => (
                  <div
                    key={service}
                    className="border-border/70 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{t(`mockup.services.${service}`)}</p>
                      <p className="text-muted-foreground text-xs">{MOCK_TIMES[service - 1]}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-primary text-sm font-semibold">
                        {MOCK_PRICES[service - 1]}
                      </span>
                      <span className="border-primary/30 text-primary rounded-full border px-3 py-1 text-xs font-semibold">
                        {tc("nav.book")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/60 mt-5 rounded-2xl px-4 py-3">
                <p className="text-muted-foreground text-xs">{t("mockup.next")}</p>
                <p className="font-display text-lg font-semibold">Jeudi 14 h 30</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Voice-of-customer band (replaces the usual generic stats row) */}
      <section className="bg-[#FAF8F5]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <blockquote className="font-display text-navy text-2xl font-medium leading-snug sm:text-[1.75rem]">
            « {t("quoteBand.text")} »
          </blockquote>
          <p className="text-muted-foreground mt-4 text-sm font-medium">{t("quoteBand.author")}</p>
        </div>
      </section>

      {/* 3. Problem */}
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-navy text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("problem.title")}
        </h2>
        <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-[1.0625rem] leading-relaxed">
          {t("problem.description")}
        </p>
      </section>

      {/* 4. How it works */}
      <section className="border-border/60 border-y bg-[#FAF8F5]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-navy text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("solution.title")}
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step) => (
              <div key={step} className="text-center sm:text-left">
                <span className="font-display text-primary/25 text-4xl font-semibold">0{step}</span>
                <h3 className="font-display mt-3 text-xl font-semibold">
                  {t(`solution.steps.${step}.title`)}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {t(`solution.steps.${step}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Demo */}
      <section id="demo" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-navy text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("demo.title")}
        </h2>
        <p className="text-muted-foreground mt-3 text-center">{t("demo.subtitle")}</p>
        <div className="shadow-primary/20 mt-10 flex aspect-video items-center justify-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] shadow-xl">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl text-white backdrop-blur">
            ▶
          </span>
        </div>
      </section>

      {/* 6. What's inside */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-navy text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="text-muted-foreground mt-4 text-[1.0625rem] leading-relaxed">
            {t("features.subtitle")}
          </p>
        </div>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {FEATURES.map(({ key, Icon }) => (
            <div key={key} className="flex gap-5">
              <span className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                <Icon className="h-[22px] w-[22px]" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">
                  {t(`features.items.${key}.title`)}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {t(`features.items.${key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Pricing */}
      <Pricing />

      {/* 8. Testimonials */}
      <section id="testimonials" className="border-border/60 border-y bg-[#FAF8F5]">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-navy text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("testimonials.title")}
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <figure key={item} className="flex flex-col">
                <blockquote className="font-display text-foreground/90 flex-1 text-[1.0625rem] leading-relaxed">
                  « {t(`testimonials.items.${item}.quote`)} »
                </blockquote>
                <figcaption className="text-primary mt-4 text-sm font-semibold">
                  {t(`testimonials.items.${item}.author`)}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-navy text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("faq.title")}
        </h2>
        <div className="mt-10 space-y-2">
          {FAQ_ITEMS.map((item) => (
            <details key={item} className="border-border/70 group rounded-2xl border px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {t(`faq.questions.${item}.q`)}
                <span className="text-primary text-lg transition-transform group-open:rotate-45">
                  ＋
                </span>
              </summary>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {t(`faq.questions.${item}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. Final CTA + callback form */}
      <section id="contact" className="border-border/60 border-t bg-[#FAF8F5]">
        <div className="mx-auto grid max-w-5xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-navy text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("finalCta.title")}
            </h2>
            <p className="text-muted-foreground mt-4 text-[1.0625rem] leading-relaxed">
              {t("finalCta.subtitle")}
            </p>
            <Button asChild size="xl" className="mt-7 rounded-full px-8">
              <AppLink href="/register">{t("finalCta.cta")}</AppLink>
            </Button>
          </div>
          <DemoForm />
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="border-border/60 bg-card border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-lockup.png"
            alt="Bookedforreal"
            width={560}
            height={364}
            className="h-24 w-auto"
          />
          <p className="text-muted-foreground mt-3 max-w-md text-sm">{t("footer.tagline")}</p>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            {CITY_DIRS.map((dir) => (
              <div key={dir.segment}>
                <p className="text-sm font-semibold">{t(dir.label)}</p>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
                  {citySlugs.map((slug) => (
                    <li key={slug}>
                      <Link
                        href={`/${locale}/${dir.segment}/${slug}`}
                        className="text-muted-foreground hover:text-primary text-sm transition-colors"
                      >
                        {cityDisplayName(slug)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-border/60 mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t pt-6">
            {COMPANY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                className="text-muted-foreground hover:text-primary text-sm transition-colors"
              >
                {t(link.label)}
              </Link>
            ))}
          </div>

          <p className="text-muted-foreground mt-6 text-xs">
            © {new Date().getFullYear()} Bookedforreal. {t("footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
