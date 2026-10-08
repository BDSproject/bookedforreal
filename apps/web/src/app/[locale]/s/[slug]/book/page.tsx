"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, Input, Label } from "@bookedforreal/ui";

import { apiFetch } from "@/lib/api-client";
import type { Salon, Service } from "@/lib/api-types";
import { groupServices } from "@/lib/service-groups";

type Step = "service" | "datetime" | "contact";

interface Slot {
  time: string;
  startAt: string;
  /** Staff who can take this slot — resolved when the client has no preference. */
  staffId: string;
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
  /** "" means "anyone"; otherwise the id of the chosen hairdresser. */
  const [staffChoice, setStaffChoice] = useState("");
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

  /**
   * Loads the free slots of the day. Without a preference the API returns them
   * per staff member, so they are merged and each slot remembers who can take it.
   */
  async function loadSlots(selectedDate: string, chosenStaff = staffChoice) {
    if (!service) return;
    const qs = `date=${selectedDate}&serviceId=${service.id}${chosenStaff ? `&staffId=${chosenStaff}` : ""}`;
    const data = await apiFetch<{ slots: Record<string, { time: string; startAt: string }[]> }>(
      `/public/salons/${params.slug}/availability?${qs}`,
    );

    const merged = new Map<string, Slot>();
    for (const [staffId, staffSlots] of Object.entries(data.slots)) {
      for (const item of staffSlots) {
        if (!merged.has(item.startAt)) {
          merged.set(item.startAt, { ...item, staffId });
        }
      }
    }

    setSlots([...merged.values()].sort((a, b) => a.startAt.localeCompare(b.startAt)));
  }

  async function confirm() {
    if (!service || !slot || !salon) return;
    try {
      // The slot already knows who is free at that time.
      const staffId = staffChoice || slot.staffId;
      await apiFetch(`/public/salons/${salon.slug}/appointments`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: service.id,
          staffId,
          name,
          phone,
          email,
          startAt: slot.startAt,
        }),
      });
      setDone(true);
    } catch {
      setError("error");
    }
  }

  // A service assigned to nobody is open to the whole team.
  const assigned = service?.staff?.map((member) => member.id) ?? [];
  const eligibleStaff = (salon?.staff ?? []).filter(
    (member) => assigned.length === 0 || assigned.includes(member.id),
  );

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold">{t("confirmation.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("confirmation.subtitle")}</p>
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
        <p className="text-muted-foreground mt-2">{t("unavailableHint")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      {step === "service" ? (
        <div className="mt-6 space-y-6">
          {salon
            ? groupServices(salon.services ?? []).map((group) => (
                <div key={group.category?.id ?? "ungrouped"}>
                  <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
                    {group.category?.name ?? t("service.other")}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {group.services.map((item) => (
                      <Card key={item.id} className="hover:border-primary transition-colors">
                        <CardContent className="p-0">
                          <button
                            type="button"
                            onClick={() => {
                              setService(item);
                              // Reset the preference: the next service may be done by someone else.
                              setStaffChoice("");
                              setSlots([]);
                              setStep("datetime");
                            }}
                            className="flex w-full items-center justify-between gap-4 p-6 text-left"
                          >
                            <span>
                              <span className="block font-semibold">{item.nameFr}</span>
                              <span className="text-muted-foreground block text-sm">
                                {item.durationMin} min
                              </span>
                            </span>
                            <span className="text-primary font-semibold">
                              {(item.priceCents / 100).toFixed(2)} €
                            </span>
                          </button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            : null}
        </div>
      ) : null}

      {step === "datetime" ? (
        <div className="mt-6 space-y-4">
          {/* Only offered when the service is done by more than one person. */}
          {eligibleStaff.length > 1 ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("staff.label")}</legend>
              <div className="flex flex-wrap gap-2">
                {[{ id: "", name: t("staff.any") }, ...eligibleStaff].map((member) => (
                  <button
                    key={member.id || "any"}
                    type="button"
                    aria-pressed={staffChoice === member.id}
                    onClick={() => {
                      setStaffChoice(member.id);
                      setSlot(null);
                      if (date) void loadSlots(date, member.id);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm ${
                      staffChoice === member.id ? "bg-primary text-white" : "border"
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

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
            <Input
              id="booking-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-phone">{t("contact.phone")}</Label>
            <Input
              id="booking-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-email">{t("contact.email")}</Label>
            <Input
              id="booking-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
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
