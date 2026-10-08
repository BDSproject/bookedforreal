"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, Input, Label } from "@bookedforreal/ui";

import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import type { Salon, Service } from "@/lib/api-types";
import { groupServices } from "@/lib/service-groups";
import { isoDate } from "@/lib/week";

type Step = "service" | "datetime" | "contact";

interface Slot {
  /** Calendar date the slot belongs to, `YYYY-MM-DD`. */
  date: string;
  time: string;
  startAt: string;
  /** The hairdresser free at that time — resolved when the client has no preference. */
  staffId: string;
}

interface Range {
  from: string;
  days: number;
  timezone: string;
  slots: Record<string, Record<string, { time: string; startAt: string }[]>>;
}

/** How many days of availability to offer in one go. */
const RANGE_DAYS = 14;

const STEP_ORDER: Step[] = ["service", "datetime", "contact"];

/**
 * The client booking flow, mobile-first:
 * 1. pick a service → 2. pick a slot → 3. contact details, then a WhatsApp/SMS
 * confirmation. A sticky bottom bar keeps the selection visible at all times.
 */
export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const t = useTranslations("booking");
  const te = useTranslations("errors");

  const [step, setStep] = useState<Step>("service");
  const [salon, setSalon] = useState<Salon | null>(null);
  const [service, setService] = useState<Service | null>(null);
  /** "" means "anyone"; otherwise the id of the chosen hairdresser. */
  const [staffChoice, setStaffChoice] = useState("");
  const [range, setRange] = useState<Range | null>(null);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    apiFetch<Salon>(`/public/salons/${params.slug}`)
      .then(setSalon)
      .catch(() => setError("error"));
  }, [params.slug]);

  // A service assigned to nobody is open to the whole team.
  const assigned = service?.staff?.map((member) => member.id) ?? [];
  const eligibleStaff = (salon?.staff ?? []).filter(
    (member) => assigned.length === 0 || assigned.includes(member.id),
  );

  // Reload the coming two weeks of slots whenever the service or the choice changes.
  useEffect(() => {
    if (!service || !salon) return;
    let active = true;
    setLoadingSlots(true);
    const from = isoDate(new Date());
    const qs = `serviceId=${service.id}&from=${from}&days=${RANGE_DAYS}${
      staffChoice ? `&staffId=${staffChoice}` : ""
    }`;
    apiFetch<Range>(`/public/salons/${params.slug}/availability/range?${qs}`)
      .then((data) => {
        if (active) setRange(data);
      })
      .catch(() => {
        if (active) setError("error");
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [service, staffChoice, salon, params.slug]);

  // Flatten the range into days, each with its merged slot chips.
  const days = useMemo(() => {
    if (!range) return [];
    return Object.entries(range.slots)
      .map(([date, byStaff]) => {
        const merged = new Map<string, Slot>();
        for (const [staffId, slots] of Object.entries(byStaff)) {
          for (const slot of slots) {
            if (!merged.has(slot.startAt)) {
              merged.set(slot.startAt, { ...slot, date, staffId });
            }
          }
        }
        return {
          date,
          slots: [...merged.values()].sort((a, b) => a.startAt.localeCompare(b.startAt)),
        };
      })
      .filter((day) => day.slots.length > 0);
  }, [range]);

  /** "lun. 12 oct." in the salon's language. */
  function dayLabel(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  /** Goes back one step, preserving the choices already made. */
  function goBack() {
    const index = STEP_ORDER.indexOf(step);
    if (index > 0) setStep(STEP_ORDER[index - 1] ?? "service");
  }

  async function confirm() {
    if (!service || !selected || !salon) return;
    try {
      await apiFetch(`/public/salons/${salon.slug}/appointments`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: service.id,
          staffId: staffChoice || selected.staffId,
          firstName,
          lastName,
          phone,
          email,
          startAt: selected.startAt,
        }),
      });
      setDone(true);
    } catch {
      setError("slotTaken");
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold">{t("confirmation.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("confirmation.subtitle")}</p>
        <Link
          href="/client/login"
          className="text-primary mt-6 inline-block text-sm font-semibold underline-offset-4 hover:underline"
        >
          {t("confirmation.track")}
        </Link>
      </main>
    );
  }

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

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <main className="mx-auto max-w-md px-4 pb-28 pt-6 sm:px-6">
      {/* --- Step indicator ------------------------------------------------- */}
      <div className="flex items-center gap-2">
        {STEP_ORDER.map((id, index) => (
          <div key={id} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                index <= stepIndex ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`hidden text-xs font-medium sm:block ${
                index <= stepIndex ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {t(`steps.${id}`)}
            </span>
            {index < STEP_ORDER.length - 1 ? (
              <span className={`h-px flex-1 ${index < stepIndex ? "bg-primary" : "bg-muted"}`} />
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{t(`steps.${step}`)}</h1>
        {step !== "service" ? (
          <button
            type="button"
            onClick={goBack}
            className="text-muted-foreground hover:text-foreground text-sm font-medium"
          >
            ← {t("back")}
          </button>
        ) : null}
      </div>

      {step === "service" ? (
        <div className="mt-5 space-y-6">
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
                              setStaffChoice("");
                              setSelected(null);
                              setStep("datetime");
                            }}
                            className="flex min-h-20 w-full items-center justify-between gap-4 p-5 text-left"
                          >
                            <span>
                              <span className="block text-base font-semibold">{item.nameFr}</span>
                              <span className="text-muted-foreground block text-sm">
                                {item.durationMin} min
                              </span>
                            </span>
                            <span className="text-primary shrink-0 font-semibold">
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
        <div className="mt-5 space-y-5">
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
                      setSelected(null);
                    }}
                    className={`rounded-full px-4 py-2.5 text-sm ${
                      staffChoice === member.id ? "bg-primary text-white" : "border"
                    }`}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <p className="text-sm font-medium">{t("pickSlot")}</p>

          {loadingSlots ? (
            <p className="text-muted-foreground">…</p>
          ) : days.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
              {t("noSlots")}
            </p>
          ) : (
            <div className="space-y-5">
              {days.map((day) => (
                <div key={day.date}>
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
                    {dayLabel(day.date)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {day.slots.map((slot) => (
                      <button
                        key={slot.startAt}
                        type="button"
                        aria-pressed={selected?.startAt === slot.startAt}
                        onClick={() => {
                          setSelected(slot);
                          setStep("contact");
                        }}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                          selected?.startAt === slot.startAt
                            ? "bg-primary text-white"
                            : "bg-card border"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {step === "contact" ? (
        <form
          id="booking-form"
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="booking-first">{t("contact.firstName")}</Label>
              <Input
                id="booking-first"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-last">{t("contact.lastName")}</Label>
              <Input
                id="booking-last"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
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
              required
            />
          </div>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {te("slotTaken")}
            </p>
          ) : null}
        </form>
      ) : null}

      {/* --- Sticky bottom bar --------------------------------------------- */}
      {step !== "service" ? (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-md">
            {step === "datetime" && service ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">{t("selectedService")}</p>
                  <p className="truncate font-semibold">
                    {service.nameFr} · {(service.priceCents / 100).toFixed(2)} €
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep("service")}>
                  {t("change")}
                </Button>
              </div>
            ) : null}

            {step === "contact" && service && selected ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">{t("selectedService")}</p>
                  <p className="truncate font-semibold">
                    {service.nameFr} · {dayLabel(selected.date)} {selected.time}
                  </p>
                </div>
                <Button
                  type="submit"
                  form="booking-form"
                  disabled={!firstName || !lastName || !email}
                  size="lg"
                >
                  {t("confirm")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
