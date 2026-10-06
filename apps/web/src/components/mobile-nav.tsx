"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export interface MobileNavLink {
  href: string;
  /** Already-translated label. */
  label: string;
}

/**
 * Mobile navigation (below `lg`, where the desktop navbar is hidden).
 *
 * The links stay in the DOM even while the panel is collapsed, so the mobile
 * rendering exposes the same navigation as the desktop one — which is what
 * mobile-first indexing looks at.
 */
export function MobileNav({ links }: { links: readonly MobileNavLink[] }) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={t("nav.menu")}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-accent lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      <nav
        id="mobile-nav"
        aria-label={t("nav.menu")}
        className={`absolute inset-x-0 top-full border-b border-border/70 bg-background/95 shadow-lg backdrop-blur-md lg:hidden ${
          open ? "block" : "hidden"
        }`}
      >
        <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="mt-2 flex flex-col gap-2 sm:hidden">
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              {t("nav.startFree")}
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
