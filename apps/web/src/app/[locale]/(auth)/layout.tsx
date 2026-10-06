import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Private area: login / register pages must never be indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
