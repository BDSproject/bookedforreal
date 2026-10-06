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

  return {
    title: salon ? `${prefix} ${salon.name}` : "Bookedforreal",
    robots: { index: false, follow: true },
  };
}

export default function BookLayout({ children }: BookLayoutProps) {
  return <>{children}</>;
}
