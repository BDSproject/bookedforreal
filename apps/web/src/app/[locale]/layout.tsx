import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";
import { isLocale, routing, type AppLocale } from "@/i18n/routing";
import { hreflangAlternates } from "@/lib/seo";

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

/** Inter with latin subsetting (Core Web Vitals: fewer bytes, preconnected). */
const inter = Inter({ subsets: ["latin"], display: "swap" });

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

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;

  if (!isLocale(locale)) {
    notFound();
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale);

  // Make messages available to client components (e.g. the locale switcher).
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="text-xl font-extrabold tracking-tight text-primary">
              Bookedforreal
            </Link>
            <LocaleSwitcher />
          </header>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
