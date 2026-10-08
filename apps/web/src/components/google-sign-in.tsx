"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/** Present only when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured. */
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Module-level guard: Google's initialize() must be called once per page load. */
let initialized = false;

interface GoogleSignInButtonProps {
  /** Receives the Google ID token (JWT), sent to /auth/client/google. */
  onCredential: (credential: string) => void;
}

/**
 * Renders the "Continue with Google" button from Google Identity Services.
 * It is silently hidden until the Google OAuth client id is configured.
 */
export function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const holder = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || initialized) {
      return;
    }

    const render = () => {
      const google = window.google;
      if (!google || !holder.current) {
        return;
      }

      initialized = true;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => callbackRef.current(response.credential),
      });
      google.accounts.id.renderButton(holder.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
    };

    // The script may already be loaded (another instance of this button).
    if (window.google?.accounts) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }
  return <div ref={holder} className="flex justify-center" />;
}
