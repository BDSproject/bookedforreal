"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { Salon } from "@/lib/api-types";

type PlanKey = "STARTER" | "PRO";
type Interval = "monthly" | "yearly";

export default function SettingsPage() {
  const t = useTranslations("dashboard.billing");
  const { data, loading } = useApiData<{ salon: Salon }>("/salons/me");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  if (loading || !data) {
    return <p className="text-muted-foreground">…</p>;
  }

  const salon = data.salon;

  async function save() {
    await apiFetch("/salons/me", { method: "PATCH", body: JSON.stringify({ name }) });
    setSaved(true);
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
          <p className="text-sm text-muted-foreground">Slug : {salon.slug}</p>
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
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

          <div className="space-y-3">
            {(["STARTER", "PRO"] as const).map((plan) => (
              <div
                key={plan}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <span className="font-semibold">{plan === "PRO" ? "Pro" : "Starter"}</span>
                <div className="flex gap-2">
                  {(["monthly", "yearly"] as const).map((interval) => (
                    <Button
                      key={interval}
                      size="sm"
                      variant={plan === "PRO" ? "default" : "outline"}
                      disabled={busy !== null}
                      onClick={() => subscribe(plan, interval)}
                    >
                      {t(interval)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button variant="ghost" className="w-full" disabled={busy !== null} onClick={openPortal}>
            {t("manage")}
          </Button>

          {busy ? <p className="text-sm text-muted-foreground">{t("redirecting")}</p> : null}
          {error ? <p className="text-sm text-destructive">{t("error")}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
