"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Official WhatsApp install links.
 * `whatsapp.com/download` detects the platform itself, so it is a safe default
 * for the first render; we swap to the exact store once the device is known.
 */
const STORE = {
  ios: "https://apps.apple.com/app/whatsapp-messenger/id310633997",
  android: "https://play.google.com/store/apps/details?id=com.whatsapp",
  fallback: "https://www.whatsapp.com/download",
} as const;

/** Picks the right store for the visitor's device (safe before hydration). */
export function useWhatsappInstallUrl(): string {
  const [url, setUrl] = useState<string>(STORE.fallback);

  useEffect(() => {
    const agent = navigator.userAgent;
    if (/android/i.test(agent)) {
      setUrl(STORE.android);
    } else if (/iphone|ipad|ipod|macintosh/i.test(agent)) {
      setUrl(STORE.ios);
    }
  }, []);

  return url;
}

/**
 * Link inviting a client to install WhatsApp.
 *
 * Placed right after a booking: reminders go out on WhatsApp first and only fall
 * back to SMS (more expensive) when the client is not on WhatsApp, so this is
 * where the nudge is both useful and welcome.
 */
export function WhatsappInstallLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const url = useWhatsappInstallUrl();

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
