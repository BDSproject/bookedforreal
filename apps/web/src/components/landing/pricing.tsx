"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@bookedforreal/ui";

const FEATURES = [1, 2, 3, 4, 5, 6] as const;

interface PlanCardProps {
  planKey: "starter" | "pro";
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
      className={`relative rounded-3xl border p-8 ${
        highlight ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" : "border-border bg-card"
      }`}
    >
      {highlight ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-white shadow-md">
          {t("popular")}
        </span>
      ) : null}

      <h3 className="text-xl font-bold">{t(`${planKey}.name`)}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t(`${planKey}.description`)}</p>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-5xl font-extrabold text-primary">{price} €</span>
        <span className="text-sm font-semibold text-muted-foreground">HT</span>
        <span className="text-lg text-muted-foreground line-through">{publicPrice} €</span>
      </div>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-primary">{t("launchBadge")}</p>

      <ul className="mt-6 space-y-2.5">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              ✓
            </span>
            {t(`${planKey}.features.${feature}`)}
          </li>
        ))}
      </ul>

      <Button size="xl" className="mt-8 w-full" variant={highlight ? "default" : "outline"}>
        {t("cta")}
      </Button>
    </div>
  );
}

/** Third tier: no fixed price — a sales-led quote for multi-shop / premium clients. */
function CustomCard() {
  const t = useTranslations("home.pricing.custom");

  return (
    <div className="relative flex flex-col rounded-3xl border border-border bg-card p-8">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-bold text-primary">
        {t("badge")}
      </span>

      <h3 className="mt-1 text-xl font-bold">{t("name")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

      <div className="mt-5">
        <span className="text-4xl font-extrabold text-navy">{t("price")}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("priceNote")}</p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
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

/** Pricing section with a monthly/yearly toggle (-20%) and a quote-based third tier. */
export function Pricing() {
  const t = useTranslations("home.pricing");
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
        {t("title")}
      </h2>
      <p className="mt-3 text-center text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8 flex items-center justify-center gap-2 rounded-full border bg-card p-1">
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

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <PlanCard planKey="starter" yearly={yearly} highlight={false} />
        <PlanCard planKey="pro" yearly={yearly} highlight />
        <CustomCard />
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs font-medium text-primary">
        {t("launchNote")}
      </p>
      <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-muted-foreground">
        {t("vatNote")}
      </p>
    </section>
  );
}
