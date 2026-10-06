import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isLocale, type AppLocale } from "@/i18n/routing";
import { blogArticles } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

interface BlogPageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const locale = params.locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "seo.blog" });
  return buildMetadata({ locale, title: t("title"), description: t("description"), path: "blog" });
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = params;
  if (!isLocale(locale)) {
    return null;
  }
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Blog</h1>
      <ul className="mt-8 space-y-4">
        {blogArticles.map((article) => {
          const data = article[locale as AppLocale];
          return (
            <li key={article.slug}>
              <Link
                href={`/${locale}/blog/${article.slug}`}
                className="hover:border-primary block rounded-xl border p-6 transition-colors"
              >
                <p className="text-muted-foreground text-xs">{article.category}</p>
                <h2 className="mt-1 text-lg font-semibold">{data.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm">{data.description}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
