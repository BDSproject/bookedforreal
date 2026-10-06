import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Poppins } from "next/font/google";
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

/** Body font: Poppins, exposed as `font-sans`. */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

/** Headline font: Fraunces, a warm serif that gives the brand a human, editorial voice. */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-display",
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const ogImage = `${baseUrl}/${locale}/opengraph-image`;

  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL(baseUrl),
    alternates: hreflangAlternates(locale as AppLocale),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${baseUrl}/${locale}`,
      siteName: "Bookedforreal",
      type: "website",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
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
      <body
        className={`${poppins.variable} ${fraunces.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
            <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
              <Link href="/" className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-mark.png"
                  alt="Bookedforreal"
                  width={420}
                  height={188}
                  className="h-9 w-auto"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-wordmark.png"
                  alt=""
                  width={640}
                  height={84}
                  className="hidden h-4 w-auto sm:block"
                />
              </Link>

              <nav className="hidden items-center gap-7 lg:flex">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    className="relative py-1 text-sm font-medium text-muted-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-200 hover:text-foreground hover:after:w-full"
                  >
                    {t(link.key)}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <LocaleSwitcher />
                <Link
                  href="/login"
                  className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
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
