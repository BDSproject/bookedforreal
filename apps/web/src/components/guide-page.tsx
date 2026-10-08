import { Button } from "@bookedforreal/ui";

import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getGuide } from "@/lib/guide";

/** Public "go live in 10 minutes" guide: a checklist, six steps, and a CTA. */
export function GuidePage({ locale }: { locale: AppLocale }) {
  const guide = getGuide(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <span className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1 text-xs font-bold">
        {guide.promise}
      </span>
      <h1 className="text-navy font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        {guide.title}
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{guide.intro}</p>

      <section className="bg-card mt-10 rounded-2xl border p-6">
        <h2 className="font-display text-lg font-semibold">{guide.checklistTitle}</h2>
        <ul className="mt-3 space-y-2">
          {guide.checklist.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <span className="border-primary/40 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border" />
              <span className="text-muted-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="font-display mt-14 text-2xl font-semibold">{guide.stepsTitle}</h2>

      <ol className="mt-6 space-y-8">
        {guide.steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="bg-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                <span className="text-muted-foreground text-xs font-semibold">{step.duration}</span>
              </div>
              <p className="text-muted-foreground mt-2 leading-relaxed">{step.body}</p>
              {step.tips ? (
                <ul className="mt-3 space-y-1.5">
                  {step.tips.map((tip) => (
                    <li key={tip} className="text-muted-foreground flex items-start gap-2 text-sm">
                      <span className="text-primary font-bold">→</span>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <section className="bg-primary/5 border-primary/20 mt-14 rounded-2xl border p-6">
        <h2 className="font-display text-lg font-semibold">{guide.afterTitle}</h2>
        <ul className="mt-3 space-y-2">
          {guide.after.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <span className="bg-primary/15 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                ✓
              </span>
              <span className="text-muted-foreground leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 text-center">
        <Button size="xl" asChild>
          <Link href="/register">{guide.cta}</Link>
        </Button>
        <p className="text-muted-foreground mt-3 text-xs">{guide.ctaNote}</p>
      </div>
    </main>
  );
}
