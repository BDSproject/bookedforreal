"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@bookedforreal/ui";

/** Simple demo-request form (client). */
export function DemoForm() {
  const t = useTranslations("home.finalCta");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    // TODO: POST to the API (notifications/demo lead) once the endpoint exists.
    setSent(true);
  }

  if (sent) {
    return <p className="text-center text-primary">✓</p>;
  }

  return (
    <div className="rounded-2xl border bg-card p-8">
      <h3 className="text-xl font-bold">{t("demoTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("demoSubtitle")}</p>
      <div className="mt-6 space-y-4">
        <input
          className="h-12 w-full rounded-xl border border-input bg-background px-4"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="h-12 w-full rounded-xl border border-input bg-background px-4"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button size="xl" className="w-full" onClick={submit} disabled={!name || !phone}>
          {t("demoTitle")}
        </Button>
      </div>
    </div>
  );
}
