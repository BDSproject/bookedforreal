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
    return (
      <div className="bg-card flex flex-col items-center justify-center rounded-3xl border p-12 text-center">
        <span className="bg-primary/15 text-primary flex h-14 w-14 items-center justify-center rounded-full text-2xl">
          ✓
        </span>
        <p className="mt-4 font-semibold">{t("demoSent")}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl border p-8 shadow-sm">
      <h3 className="text-xl font-bold">{t("demoTitle")}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{t("demoSubtitle")}</p>
      <div className="mt-6 space-y-4">
        <input
          className="border-input bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-12 w-full rounded-xl border px-4 text-sm outline-none transition-colors focus:ring-2"
          placeholder={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border-input bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-12 w-full rounded-xl border px-4 text-sm outline-none transition-colors focus:ring-2"
          placeholder={t("phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button size="xl" className="w-full" onClick={submit} disabled={!name || !phone}>
          {t("demoCta")}
        </Button>
      </div>
    </div>
  );
}
