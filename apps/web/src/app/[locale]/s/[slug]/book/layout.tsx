import type { Metadata } from "next";
import type { ReactNode } from "react";

import { prisma } from "@bookedforreal/db";

interface BookLayoutProps {
  children: ReactNode;
  params: { locale: string; slug: string };
}

/**
 * The booking flow is client-rendered and near-duplicate of the salon page, so
 * it gets a proper title but is kept out of the index (the salon page ranks).
 */
export async function generateMetadata({ params }: BookLayoutProps): Promise<Metadata> {
  const salon = await prisma.salon.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  const prefix = params.locale === "fr" ? "Réserver chez" : "Book at";
  const suffix =
    params.locale === "fr"
      ? "Choisissez un service, une date et une heure en 3 clics."
      : "Pick a service, a date and a time in 3 clicks.";

  return {
    title: salon ? `${prefix} ${salon.name}` : "Bookedforreal",
    description: salon ? `${prefix} ${salon.name}. ${suffix}` : suffix,
    robots: { index: false, follow: true },
  };
}

export default function BookLayout({ children }: BookLayoutProps) {
  return <>{children}</>;
}
