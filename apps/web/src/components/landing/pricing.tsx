"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@bookedforreal/ui";

const FEATURES = [1, 2, 3, 4, 5] as const;

interface PlanCardProps {
  planKey: "starter" | "pro";
  yearly: boolean;
  highlight: boolean;
}

function PlanCard({ planKey, yearly, highlight }: PlanCardProps) {
  const t = useTranslations("home.pricing");
  const price = yearly ? t(`${planKey}.priceYearly`) : t(`${planKey}.priceMonthly`);

  return (
    <div className={`rounded-2xl border p-8 ${highlight ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}>
      <h3 className="text-xl font-bold">{t(`${planKey}.name`)}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t(`${planKey}.description`)}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-extrabold text-primary">{price} €</span>
        <span className="text-muted-foreground">/ {t("monthly").toLowerCase()}</span>
      </div>
      <ul className="mt-6 space-y-2">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <span className="text-primary">✓</span> {t(`${planKey}.features.${feature}`)}
          </li>
        ))}
      </ul>
      <Button size="xl" className="mt-8 w-full" variant={highlight ? "default" : "outline"}>
        {t("cta")}
      </Button>
    </div>
  );
}

/** Pricing section with a monthly/yearly toggle (-20%). */
export function Pricing() {
  const t = useTranslations("home.pricing");
  const [yearly, setYearly] = useState(false);

  return (
    <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-extrabold tracking-tight">{t("title")}</h2>
      <p className="mt-2 text-center text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setYearly(false)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${!yearly ? "bg-primary text-white" : "text-muted-foreground"}`}
        >
          {t("monthly")}
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${yearly ? "bg-primary text-white" : "text-muted-foreground"}`}
        >
          {t("yearly")} <span className="text-xs opacity-80">{t("save")}</span>
        </button>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <PlanCard planKey="starter" yearly={yearly} highlight={false} />
        <PlanCard planKey="pro" yearly={yearly} highlight />
      </div>
    </section>
  );
}
