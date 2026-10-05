import type { ReactNode } from "react";

import "./globals.css";

/**
 * Root layout pass-through.
 * The `<html>` and `<body>` tags are rendered by the `[locale]` layout so that
 * the `lang` attribute can reflect the active locale.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
