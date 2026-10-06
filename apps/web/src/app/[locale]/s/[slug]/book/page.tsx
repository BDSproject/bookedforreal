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

  // The salon's trial ended without a subscription: booking is closed.
  if (salon && salon.bookingEnabled === false) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-3xl" aria-hidden>
          🔒
        </p>
        <h1 className="mt-4 text-2xl font-bold">{t("unavailable")}</h1>
        <p className="mt-2 text-muted-foreground">{t("unavailableHint")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      {step === "service" ? (
        <div className="mt-6 space-y-3">
          {salon?.services?.map((item) => (
            <Card key={item.id} className="transition-colors hover:border-primary">
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => {
                    setService(item);
                    setStep("datetime");
                  }}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span>
                    <span className="block font-semibold">{item.nameFr}</span>
                    <span className="block text-sm text-muted-foreground">{item.durationMin} min</span>
                  </span>
                  <span className="font-semibold text-primary">
                    {(item.priceCents / 100).toFixed(2)} €
                  </span>
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {step === "datetime" ? (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-date">{t("date")}</Label>
            <Input
              id="booking-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                void loadSlots(e.target.value);
              }}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("time")}</legend>
            <div className="flex flex-wrap gap-2">
              {slots.map((item) => (
                <button
                  key={item.startAt}
                  type="button"
                  aria-pressed={slot?.startAt === item.startAt}
                  onClick={() => {
                    setSlot(item);
                    setStep("contact");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm ${
                    slot?.startAt === item.startAt ? "bg-primary text-white" : "border"
                  }`}
                >
                  {item.time}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {step === "contact" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="booking-name">{t("contact.name")}</Label>
            <Input id="booking-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-phone">{t("contact.phone")}</Label>
            <Input id="booking-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-email">{t("contact.email")}</Label>
            <Input id="booking-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {te("slotTaken")}
            </p>
          ) : null}
          <Button type="submit" size="xl" className="w-full" disabled={!name}>
            {t("confirm")}
          </Button>
        </form>
      ) : null}
    </main>
  );
}
