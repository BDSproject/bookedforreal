"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALES: AppLocale[] = ["en", "fr"];

/** Simple two-button language switcher (FR/EN). */
export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <nav aria-label="Language" className="flex items-center gap-1 rounded-full border bg-card p-1">
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => switchTo(item)}
          disabled={isPending || item === locale}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold uppercase transition-colors",
            item === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item}
        </button>
      ))}
    </nav>
  );
}
