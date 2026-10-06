"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@bookedforreal/ui";

import { Link, useRouter } from "@/i18n/navigation";
import { apiFetch, getToken } from "@/lib/api-client";

const NAV_ITEMS = [
  { href: "/dashboard", key: "dashboard" },
  { href: "/appointments", key: "appointments" },
  { href: "/clients", key: "clients" },
  { href: "/services", key: "services" },
  { href: "/staff", key: "staff" },
  { href: "/settings", key: "settings" },
] as const;

interface TrialStatus {
  daysLeft: number;
  expired: boolean;
}

/**
 * Authenticated shell: guards the session, shows how many trial days are left
 * and locks the app (keeping Settings reachable) once the trial has ended.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslations("dashboard.nav");
  const tt = useTranslations("dashboard.trial");
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [trial, setTrial] = useState<TrialStatus | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    apiFetch<{ trial: TrialStatus }>("/salons/me")
      .then((data) => setTrial(data.trial))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="bg-card hidden w-60 shrink-0 border-r p-4 sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-lockup.png"
          alt="Bookedforreal"
          width={560}
          height={364}
          className="h-16 w-auto"
        />
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        {trial && !trial.expired ? (
          <p className="border-primary/20 bg-primary/5 text-primary border-b px-4 py-2.5 text-center text-sm font-medium sm:px-8">
            {tt("daysLeft", { days: trial.daysLeft })}
          </p>
        ) : null}

        <main className="bg-surface p-4 sm:p-8">
          {!ready ? (
            <p className="text-muted-foreground">…</p>
          ) : trial?.expired ? (
            <div className="bg-card mx-auto max-w-lg rounded-3xl border p-8 text-center">
              <span className="text-4xl" aria-hidden>
                ⏳
              </span>
              <h1 className="font-display text-navy mt-4 text-2xl font-semibold">
                {tt("expiredTitle")}
              </h1>
              <p className="text-muted-foreground mt-3 leading-relaxed">{tt("expiredBody")}</p>
              <Button asChild size="xl" className="mt-6 rounded-full">
                <Link href="/settings">{tt("cta")}</Link>
              </Button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
