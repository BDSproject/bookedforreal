"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@bookedforreal/ui";

import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";

/**
 * Confirms the inbox from the link sent after a booking.
 * The token is read from the query string and verified against the API.
 */
export default function VerifyEmailPage() {
  const t = useTranslations("client");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setState("error");
      return;
    }
    apiFetch("/client/verify", { method: "POST", body: JSON.stringify({ token }) })
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">{t("verifyTitle")}</h1>

      {state === "loading" ? (
        <p className="text-muted-foreground mt-4">…</p>
      ) : state === "ok" ? (
        <>
          <p className="text-muted-foreground mt-4">{t("verifyOk")}</p>
          <Button asChild size="xl" className="mt-6 rounded-full px-8">
            <Link href="/client/login">{t("signIn")}</Link>
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground mt-4">{t("verifyError")}</p>
      )}
    </main>
  );
}
