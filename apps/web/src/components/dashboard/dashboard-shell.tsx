"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { getToken } from "@/lib/api-client";

const NAV_ITEMS = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/appointments", key: "appointments" },
  { href: "/clients", key: "clients" },
  { href: "/services", key: "services" },
  { href: "/staff", key: "staff" },
  { href: "/settings", key: "settings" },
] as const;

/** Authenticated shell: guards the session and renders the sidebar. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslations("dashboard.nav");
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-60 shrink-0 border-r bg-card p-4 sm:block">
        <p className="text-lg font-bold text-primary">Bookedforreal</p>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 bg-surface p-4 sm:p-8">{children}</main>
    </div>
  );
}
