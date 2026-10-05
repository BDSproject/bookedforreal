import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import Script from "next/script";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";
import { isLocale, routing, type AppLocale } from "@/i18n/routing";
import { hreflangAlternates } from "@/lib/seo";

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

/** Poppins (brand font, Phonilab-inspired) with latin subsetting for fast loading. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Pre-render every supported locale at build time (SSG). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** SEO metadata: translated title/description + hreflang/x-default alternates. */
export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "seo.home" });

  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    alternates: hreflangAlternates(locale as AppLocale),
  };
}

/** Anchor links in the public navbar (same-page sections). */
const NAV_LINKS = [
  { href: "#features", key: "nav.features" },
  { href: "#pricing", key: "nav.pricing" },
  { href: "#testimonials", key: "nav.testimonials" },
  { href: "#faq", key: "nav.faq" },
] as const;

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;

  if (!isLocale(locale)) {
    notFound();
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale);

  // Make messages available to client components (e.g. the locale switcher).
  const messages = await getMessages();
  const t = await getTranslations("common");

  return (
    <html lang={locale}>
      <body className={`${poppins.className} min-h-screen bg-background text-foreground antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
              <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
                  B
                </span>
                <span className="text-foreground">Bookedforreal</span>
              </Link>

              <nav className="hidden items-center gap-1 lg:flex">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(link.key)}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                <LocaleSwitcher />
                <Link
                  href="/login"
                  className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary sm:inline-flex"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  {t("nav.startFree")}
                </Link>
              </div>
            </div>
          </header>
          {children}
        </NextIntlClientProvider>

        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL ? (
          <Script
            async
            src={process.env.NEXT_PUBLIC_UMAMI_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
