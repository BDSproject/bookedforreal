"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@bookedforreal/ui";

import { Link as AppLink } from "@/i18n/navigation";

const FEATURES = [1, 2, 3, 4, 5, 6] as const;

interface PlanCardProps {
  planKey: "solo" | "salon";
  yearly: boolean;
  highlight: boolean;
}

function PlanCard({ planKey, yearly, highlight }: PlanCardProps) {
  const t = useTranslations("home.pricing");
  const price = yearly ? t(`${planKey}.priceYearly`) : t(`${planKey}.priceMonthly`);
  const publicPrice = yearly
    ? t(`${planKey}.pricePublicYearly`)
    : t(`${planKey}.pricePublicMonthly`);

  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-8 ${
        highlight
          ? "border-primary bg-primary/5 shadow-primary/10 shadow-xl"
          : "border-border bg-card"
      }`}
    >
      {highlight ? (
        <span className="bg-primary absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white shadow-md">
          {t("popular")}
        </span>
      ) : null}

      <h3 className="text-xl font-bold">{t(`${planKey}.name`)}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{t(`${planKey}.description`)}</p>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-primary text-5xl font-extrabold">{price} €</span>
        <span className="text-muted-foreground text-sm font-semibold">HT</span>
        <span className="text-muted-foreground text-lg line-through">{publicPrice} €</span>
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <span className="bg-primary/15 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              ✓
            </span>
            {t(`${planKey}.features.${feature}`)}
          </li>
        ))}
      </ul>

      <Button size="xl" className="mt-8 w-full" variant={highlight ? "default" : "outline"} asChild>
        <AppLink href="/register">{t("cta")}</AppLink>
      </Button>
    </div>
  );
}

/**
 * Entry tier: no subscription at all, 0,50 € only when a booking is actually made online.
 * The monthly/yearly toggle does not apply here, so the price block is rendered directly.
 */
function UsageCard() {
  const t = useTranslations("home.pricing.usage");

  return (
    <div className="border-border bg-card relative flex flex-col rounded-3xl border p-8">
      <span className="border-primary/30 bg-primary/10 text-primary absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-4 py-1 text-xs font-bold">
        {t("badge")}
      </span>

      <h3 className="mt-1 text-xl font-bold">{t("name")}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-primary text-5xl font-extrabold">{t("price")} €</span>
        <span className="text-muted-foreground text-sm font-semibold">{t("perMonth")}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">{t("priceNote")}</p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <span className="bg-primary/15 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              ✓
            </span>
            {t(`features.${feature}`)}
          </li>
        ))}
      </ul>

      <Button size="xl" variant="outline" className="mt-8 w-full" asChild>
        <AppLink href="/register">{t("cta")}</AppLink>
      </Button>
    </div>
  );
}

/** Last tier: no fixed price, a sales-led quote for multi-shop / premium clients. */
function CustomCard() {
  const t = useTranslations("home.pricing.custom");

  return (
    <div className="border-border bg-card relative flex flex-col rounded-3xl border p-8">
      <span className="border-primary/30 bg-primary/10 text-primary absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-4 py-1 text-xs font-bold">
        {t("badge")}
      </span>

      <h3 className="mt-1 text-xl font-bold">{t("name")}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{t("description")}</p>

      <div className="mt-5">
        <span className="text-navy text-4xl font-extrabold">{t("price")}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-sm">{t("priceNote")}</p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <span className="bg-primary/15 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              ✓
            </span>
            {t(`features.${feature}`)}
          </li>
        ))}
      </ul>

      <Button size="xl" variant="outline" className="mt-8 w-full" asChild>
        <a href="#contact">{t("cta")}</a>
      </Button>
    </div>
  );
}

/** Pricing section: pay-as-you-go entry, two subscriptions and a quote-based group tier. */
export function Pricing() {
  const t = useTranslations("home.pricing");
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <h2 className="text-navy text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
        {t("title")}
      </h2>
      <p className="text-muted-foreground mt-3 text-center">{t("subtitle")}</p>

      <div className="bg-card mt-8 flex items-center justify-center gap-2 rounded-full border p-1">
        <button
          type="button"
          onClick={() => setYearly(false)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            !yearly ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
            yearly ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("yearly")} <span className="text-xs opacity-80">{t("save")}</span>
        </button>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <UsageCard />
        <PlanCard planKey="solo" yearly={yearly} highlight={false} />
        <PlanCard planKey="salon" yearly={yearly} highlight />
        <CustomCard />
      </div>

      <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-center text-xs">
        {t("vatNote")}
      </p>

      <p className="mt-4 text-center">
        <AppLink
          href="/guide"
          className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
        >
          {t("guideLink")}
        </AppLink>
      </p>
    </section>
  );
}
