import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { prisma } from "@bookedforreal/db";
import { Button } from "@bookedforreal/ui";

import { DemoForm } from "@/components/landing/demo-form";
import { Pricing } from "@/components/landing/pricing";
import { JsonLd } from "@/components/json-ld";
import { isLocale } from "@/i18n/routing";
import { breadcrumbJsonLd, softwareApplicationJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/seo";

const FEATURE_ICONS = ["✂️", "📅", "💬", "📱"];
const STEPS = [1, 2, 3] as const;
const FEATURES = [1, 2, 3, 4] as const;
const TESTIMONIALS = [1, 2, 3] as const;
const FAQ_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

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

      {/* 1. Hero */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <span className="animate-in fade-in rounded-full bg-accent px-4 py-1 text-sm font-medium text-primary">
          {t("hero.badge")}
        </span>
        <h1 className="animate-in fade-in slide-in-from-bottom-4 mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-4 mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="xl" className="px-10 shadow-lg shadow-primary/20">
            {t("hero.cta")}
          </Button>
          <Button size="xl" variant="outline" className="px-10">
            {t("hero.secondary")}
          </Button>
        </div>
      </section>

      {/* 2. Problem */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight">{t("problem.title")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{t("problem.description")}</p>
      </section>

      {/* 3. Solution (3 steps) */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">{t("solution.title")}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step} className="rounded-2xl border bg-card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {step}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{t(`solution.steps.${step}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`solution.steps.${step}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Demo video */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight">{t("demo.title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("demo.subtitle")}</p>
        <div className="mt-8 flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl text-white">▶</span>
        </div>
      </section>

      {/* 5. Features */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">{t("features.title")}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature} className="rounded-2xl border bg-card p-6">
              <div className="text-2xl">{FEATURE_ICONS[feature - 1]}</div>
              <h3 className="mt-3 text-lg font-semibold">{t(`features.items.${feature}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`features.items.${feature}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Pricing */}
      <Pricing />

      {/* 7. Testimonials */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">{t("testimonials.title")}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item} className="rounded-2xl border bg-card p-6">
              <blockquote className="text-sm">“{t(`testimonials.items.${item}.quote`)}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-primary">
                {t(`testimonials.items.${item}.author`)}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">{t("faq.title")}</h2>
        <div className="mt-8 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item} className="rounded-xl border bg-card p-4">
              <summary className="cursor-pointer font-medium">{t(`faq.questions.${item}.q`)}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{t(`faq.questions.${item}.a`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 9. Final CTA + demo form */}
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-20 sm:grid-cols-2 sm:px-6">
        <div className="flex flex-col justify-center text-center sm:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight">{t("finalCta.title")}</h2>
          <p className="mt-2 text-lg text-muted-foreground">{t("finalCta.subtitle")}</p>
          <Button size="xl" className="mt-6 w-fit">
            {t("finalCta.cta")}
          </Button>
        </div>
        <DemoForm />
      </section>

      {/* 10. Footer with SEO city links */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-lg font-bold text-primary">Bookedforreal</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("footer.tagline")}</p>

          <div className="mt-8">
            <p className="text-sm font-semibold">{t("footer.cities")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cities.map((city) => (
                <Link
                  key={city.city}
                  href={`/${locale}/coiffeur/${city.city!.toLowerCase()}`}
                  className="rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Coiffeur {city.city}
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bookedforreal. {t("footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}
