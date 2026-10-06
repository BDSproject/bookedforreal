import type { AppLocale } from "@/i18n/routing";
import { getSitePage, type SitePageSlug } from "@/lib/site-pages";

/** Shared renderer for the trust / legal pages (about, contact, legal, privacy, terms). */
export function ContentPage({ slug, locale }: { slug: SitePageSlug; locale: AppLocale }) {
  const page = getSitePage(slug)[locale];

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        {page.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{page.intro}</p>

      <div className="mt-12 space-y-10">
        {page.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl font-semibold">{section.title}</h2>
            <div className="mt-3 space-y-2.5">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
