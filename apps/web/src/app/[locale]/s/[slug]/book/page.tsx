"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, Input, Label } from "@bookedforreal/ui";

import { apiFetch } from "@/lib/api-client";
import type { Salon, Service } from "@/lib/api-types";

type Step = "service" | "datetime" | "contact";

interface Slot {
  time: string;
  startAt: string;
}

export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const t = useTranslations("booking");
  const te = useTranslations("errors");

  const [step, setStep] = useState<Step>("service");
  const [salon, setSalon] = useState<Salon | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Salon>(`/public/salons/${params.slug}`)
      .then(setSalon)
      .catch(() => setError("error"));
  }, [params.slug]);

  async function loadSlots(selectedDate: string) {
    if (!service) return;
    const staffId = salon?.staff?.[0]?.id;
    const qs = `date=${selectedDate}&serviceId=${service.id}${staffId ? `&staffId=${staffId}` : ""}`;
    const data = await apiFetch<{ slots: Record<string, Slot[]> }>(`/public/salons/${params.slug}/availability?${qs}`);
    setSlots(Object.values(data.slots).flat());
  }

  async function confirm() {
    if (!service || !slot || !salon) return;
    try {
      const staffId = salon.staff?.[0]?.id ?? "";
      await apiFetch(`/public/salons/${salon.slug}/appointments`, {
        method: "POST",
        body: JSON.stringify({ serviceId: service.id, staffId, name, phone, email, startAt: slot.startAt }),
      });
      setDone(true);
    } catch {
      setError("error");
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold">{t("confirmation.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("confirmation.subtitle")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      {step === "service" ? (
        <div className="mt-6 space-y-3">
          {salon?.services?.map((item) => (
            <Card key={item.id} className="cursor-pointer">
              <CardContent
                onClick={() => {
                  setService(item);
                  setStep("datetime");
                }}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{item.nameFr}</p>
                  <p className="text-sm text-muted-foreground">{item.durationMin} min</p>
                </div>
                <p className="font-semibold text-primary">{(item.priceCents / 100).toFixed(2)} €</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {step === "datetime" ? (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>{t("date")}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                void loadSlots(e.target.value);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {slots.map((item) => (
              <button
                key={item.startAt}
                type="button"
                onClick={() => {
                  setSlot(item);
                  setStep("contact");
                }}
                className={`rounded-lg px-4 py-2 text-sm ${slot?.startAt === item.startAt ? "bg-primary text-white" : "border"}`}
              >
                {item.time}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "contact" ? (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>{t("contact.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("contact.phone")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("contact.email")}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{te("slotTaken")}</p> : null}
          <Button size="xl" className="w-full" onClick={confirm} disabled={!name}>
            {t("confirm")}
          </Button>
        </div>
      ) : null}
    </main>
  );
}
