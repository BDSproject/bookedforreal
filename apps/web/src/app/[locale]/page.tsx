import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { Button } from "@bookedforreal/ui";

interface HomePageProps {
  params: { locale: string };
}

export default function HomePage({ params }: HomePageProps) {
  setRequestLocale(params.locale);
  const t = useTranslations("home");

  const steps = [
    { number: "1", title: t("steps.1.title"), description: t("steps.1.description") },
    { number: "2", title: t("steps.2.title"), description: t("steps.2.description") },
    { number: "3", title: t("steps.3.title"), description: t("steps.3.description") },
  ];

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-12 px-4 py-16 text-center sm:px-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">{t("hero.title")}</h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">{t("hero.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="xl" className="px-12 shadow-lg shadow-primary/20">
          {t("hero.cta")}
        </Button>
        <Button size="xl" variant="outline" className="px-12">
          {t("hero.secondary")}
        </Button>
      </div>

      <ol className="grid w-full gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <li key={step.number} className="rounded-2xl border bg-card p-6 text-left">
            <span className="text-3xl font-extrabold text-primary">{step.number}</span>
            <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
