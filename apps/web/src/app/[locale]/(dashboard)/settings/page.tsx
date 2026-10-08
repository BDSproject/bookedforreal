"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { MessagingQuota, Salon } from "@/lib/api-types";

type PlanKey = "USAGE" | "SOLO" | "SALON";
type Interval = "monthly" | "yearly";

/**
 * Self-serve plans offered on this page.
 * The pay-as-you-go plan has no yearly commitment, hence a single interval.
 */
const SELF_SERVE_PLANS = [
  { key: "USAGE", labelKey: "plans.usage", intervals: ["monthly"] },
  { key: "SOLO", labelKey: "plans.solo", intervals: ["monthly", "yearly"] },
  { key: "SALON", labelKey: "plans.salon", intervals: ["monthly", "yearly"] },
] as const;

export default function SettingsPage() {
  const t = useTranslations("dashboard.billing");
  const { data, loading } = useApiData<{ salon: Salon; messaging?: MessagingQuota }>("/salons/me");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [test, setTest] = useState<"idle" | "sending" | "sent" | "nophone">("idle");

  if (loading || !data) {
    return <p className="text-muted-foreground">…</p>;
  }

  const salon = data.salon;
  const messaging = data.messaging ?? { remaining: 0, quota: 0 };

  async function save() {
    await apiFetch("/salons/me", {
      method: "PATCH",
      body: JSON.stringify({ name, ...(phone === null ? {} : { phone }) }),
    });
    setSaved(true);
  }

  /** Sends a real WhatsApp/SMS so the salon can check its setup. */
  async function sendTest() {
    setTest("sending");
    try {
      await apiFetch("/notifications/test", { method: "POST", body: JSON.stringify({}) });
      setTest("sent");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setTest(message.includes("NO_PHONE") ? "nophone" : "idle");
    }
  }

  /** Opens Stripe Checkout for the chosen plan + interval. */
  async function subscribe(plan: PlanKey, interval: Interval) {
    setBusy(`${plan}-${interval}`);
    setError(false);
    try {
      const { url } = await apiFetch<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan, interval }),
      });
      window.location.href = url;
    } catch {
      setBusy(null);
      setError(true);
    }
  }

  /** Opens the Stripe Customer Portal (update card, cancel). */
  async function openPortal() {
    setBusy("portal");
    setError(false);
    try {
      const { url } = await apiFetch<{ url: string }>("/billing/portal", { method: "POST" });
      window.location.href = url;
    } catch {
      setBusy(null);
      setError(true);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profil du salon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" defaultValue={salon.name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              defaultValue={salon.phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Ce numéro reçoit une alerte WhatsApp ou SMS à chaque nouveau rendez-vous
            </p>
          </div>
          <p className="text-muted-foreground text-sm">Slug : {salon.slug}</p>
          <Button onClick={save} disabled={!name}>
            Save
          </Button>
          {saved ? <p className="text-sm text-green-600">✓ Enregistré</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{t("subtitle")}</p>

          <div className="space-y-3">
            {SELF_SERVE_PLANS.map((plan) => (
              <div
                key={plan.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <span className="font-semibold">{t(plan.labelKey)}</span>
                <div className="flex gap-2">
                  {plan.intervals.map((interval) => (
                    <Button
                      key={interval}
                      size="sm"
                      variant={plan.key === "SALON" ? "default" : "outline"}
                      disabled={busy !== null}
                      onClick={() => subscribe(plan.key, interval)}
                    >
                      {t(interval)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">
                {messaging.whatsapp ? t("messaging.label") : t("messaging.labelSms")}
              </span>
              <span className="text-muted-foreground text-sm">
                {t("messaging.remaining", {
                  remaining: messaging.remaining,
                  quota: messaging.quota,
                })}
              </span>
            </div>
            <Button size="sm" variant="outline" disabled={test === "sending"} onClick={sendTest}>
              {t("messaging.test")}
            </Button>
            {test === "sent" ? (
              <p className="text-sm text-green-600">{t("messaging.testSent")}</p>
            ) : null}
            {test === "nophone" ? (
              <p className="text-destructive text-sm">{t("messaging.testNoPhone")}</p>
            ) : null}
          </div>

          <Button variant="ghost" className="w-full" disabled={busy !== null} onClick={openPortal}>
            {t("manage")}
          </Button>

          {busy ? <p className="text-muted-foreground text-sm">{t("redirecting")}</p> : null}
          {error ? <p className="text-destructive text-sm">{t("error")}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
