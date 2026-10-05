import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { prisma } from "@bookedforreal/db";
import { Button } from "@bookedforreal/ui";

import { DemoForm } from "@/components/landing/demo-form";
import { Pricing } from "@/components/landing/pricing";
import { JsonLd } from "@/components/json-ld";
import { Link as AppLink } from "@/i18n/navigation";
import { isLocale } from "@/i18n/routing";
import { breadcrumbJsonLd, softwareApplicationJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/seo";

const FEATURE_ICONS = ["🌐", "📅", "💬", "📱"];
const STEPS = [1, 2, 3] as const;
const FEATURES = [1, 2, 3, 4] as const;
const TESTIMONIALS = [1, 2, 3] as const;
const FAQ_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const HERO_POINTS = [1, 2, 3, 4] as const;
const HERO_TRUST = [1, 2, 3, 4] as const;
const STATS = [1, 2, 3, 4] as const;
const MOCK_SERVICES = [1, 2, 3] as const;
const MOCK_ICONS = ["✂️", "💇", "🎨"] as const;
const MOCK_TIMES = ["45 min", "30 min", "1 h 30"] as const;
const MOCK_PRICES = ["35 €", "25 €", "70 €"] as const;

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

  const software = softwareApplicationJsonLd(url, [
    { name: "Starter", price: "5" },
    { name: "Pro", price: "29" },
  ]);

  return (
    <div className="bg-background">
      <JsonLd data={software} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Bookedforreal", url }])} />

      {/* 1. Hero — two columns, Phonilab-inspired */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-gradient-to-b from-accent/60 via-background to-background"
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t("hero.badge")}
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl xl:text-6xl">
              {t("hero.title")}{" "}
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t("hero.subtitle")}
            </p>

            <ul className="mt-6 space-y-2.5">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    ✓
                  </span>
                  <span className="text-[15px] text-foreground/90">{t(`hero.points.${point}`)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl" className="px-8 shadow-lg shadow-primary/25">
                <AppLink href="/register">{t("hero.cta")}</AppLink>
              </Button>
              <Button asChild size="xl" variant="outline" className="px-8">
                <a href="#demo">{t("hero.secondary")}</a>
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-amber-500" aria-hidden>
                ★★★★★
              </span>
              <span className="text-sm text-muted-foreground">{t("hero.rating")}</span>
            </div>
          </div>

          {/* Product mockup */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-primary/25 via-primary/5 to-transparent blur-2xl"
            />
            <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-2xl shadow-primary/15">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-700 text-lg text-white">
                  ✂️
                </div>
                <div>
                  <p className="font-semibold text-foreground">Bookedforreal</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-amber-500" aria-hidden>
                      ★★★★★
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">4,9</span>
                  </div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  24/7
                </span>
              </div>

              <div className="mt-5 space-y-2.5">
                {MOCK_SERVICES.map((service) => (
                  <div
                    key={service}
                    className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg" aria-hidden>
                        {MOCK_ICONS[service - 1]}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t(`mockup.services.${service}`)}
                        </p>
                        <p className="text-xs text-muted-foreground">{MOCK_TIMES[service - 1]}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">{MOCK_PRICES[service - 1]}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-primary to-violet-700 px-4 py-3 text-white">
                <div>
                  <p className="text-xs text-white/70">{t("mockup.next")}</p>
                  <p className="font-semibold">⏱ 15:30</p>
                </div>
                <span className="rounded-lg bg-white/95 px-4 py-2 text-sm font-semibold text-primary">
                  {tc("nav.book")}
                </span>
              </div>
            </div>

            <div className="absolute -left-4 -bottom-5 flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-xl">
              <span className="text-xl" aria-hidden>
                📲
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("mockup.reminder")}</p>
                <p className="text-xs text-muted-foreground">2 h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5">
            {HERO_TRUST.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground"
              >
                <span className="text-primary" aria-hidden>
                  ✓
                </span>
                {t(`hero.trust.${item}`)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Stats strip */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat} className="text-center">
              <p className="text-3xl font-extrabold text-primary sm:text-4xl">{t(`stats.items.${stat}.value`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`stats.items.${stat}.label`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Problem */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{t("problem.title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {t("problem.description")}
        </p>
      </section>

      {/* 4. Solution (3 steps) */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          {t("solution.title")}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step} className="rounded-3xl border bg-card p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-extrabold text-white shadow-lg shadow-primary/25">
                {step}
              </div>
              <h3 className="mt-5 text-lg font-semibold">{t(`solution.steps.${step}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`solution.steps.${step}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Demo */}
      <section id="demo" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#4C1D95] shadow-2xl shadow-primary/25">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl text-white backdrop-blur">
            ▶
          </span>
        </div>
      </section>

      {/* 6. Features */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          {t("features.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">{t("features.subtitle")}</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature} className="rounded-3xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl">
                {FEATURE_ICONS[feature - 1]}
              </div>
              <h3 className="mt-5 text-lg font-semibold">{t(`features.items.${feature}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`features.items.${feature}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Pricing */}
      <Pricing />

      {/* 8. Testimonials */}
      <section id="testimonials" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          {t("testimonials.title")}
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item} className="rounded-3xl border bg-card p-8 shadow-sm">
              <span className="text-amber-500" aria-hidden>
                ★★★★★
              </span>
              <blockquote className="mt-4 text-sm leading-relaxed">
                “{t(`testimonials.items.${item}.quote`)}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {t(`testimonials.items.${item}.author`).charAt(0)}
                </span>
                <span className="text-sm font-semibold">{t(`testimonials.items.${item}.author`)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
          {t("faq.title")}
        </h2>
        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item} className="group rounded-2xl border bg-card p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {t(`faq.questions.${item}.q`)}
                <span className="ml-4 text-primary transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t(`faq.questions.${item}.a`)}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. Final CTA + demo form */}
      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col justify-center text-center lg:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">{t("finalCta.title")}</h2>
          <p className="mt-3 text-lg text-muted-foreground">{t("finalCta.subtitle")}</p>
          <Button asChild size="xl" className="mt-6 w-fit">
            <AppLink href="/register">{t("finalCta.cta")}</AppLink>
          </Button>
        </div>
        <DemoForm />
      </section>

      {/* 11. Footer with SEO city links */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-extrabold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              B
            </span>
            Bookedforreal
          </div>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("footer.tagline")}</p>

          <div className="mt-8">
            <p className="text-sm font-semibold">{t("footer.cities")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cities.map((city) => (
                <Link
                  key={city.city}
                  href={`/${locale}/coiffeur/${city.city!.toLowerCase()}`}
                  className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Coiffeur {city.city}
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-10 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bookedforreal. {t("footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
