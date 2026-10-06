import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/json-ld";
import { isLocale, type AppLocale } from "@/i18n/routing";
import { BLOG_AUTHOR, blogArticles, getArticle } from "@/lib/blog";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata, siteUrl } from "@/lib/seo";

interface ArticlePageProps {
  params: { locale: string; slug: string };
}

export function generateStaticParams() {
  return blogArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = getArticle(params.slug);
  if (!article) {
    return {};
  }
  const locale = params.locale as AppLocale;
  const data = article[locale];
  return buildMetadata({ locale, title: data.title, description: data.description, path: `blog/${article.slug}` });
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const article = getArticle(slug);
  if (!article) {
    notFound();
  }
  const data = article[locale as AppLocale];
  const url = `${siteUrl()}/${locale}/blog/${article.slug}`;
  const author = BLOG_AUTHOR[locale as AppLocale];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd
        data={articleJsonLd({
          title: data.title,
          description: data.description,
          url,
          datePublished: article.publishedAt,
          author,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Blog", url: `${siteUrl()}/${locale}/blog` },
          { name: data.title, url },
        ])}
      />

      <Link href={`/${locale}/blog`} className="text-sm text-primary">
        ← Blog
      </Link>
      <p className="mt-4 text-xs text-muted-foreground">
        {article.category} · {article.publishedAt} · {author}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{data.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{data.description}</p>

      <div className="mt-8 space-y-4">
        {data.content.map((paragraph) => (
          <p key={paragraph} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </main>
  );
}
