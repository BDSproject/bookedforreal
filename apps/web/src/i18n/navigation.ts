import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation primitives.
 * Prefer these over `next/navigation` so links carry the active locale.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
