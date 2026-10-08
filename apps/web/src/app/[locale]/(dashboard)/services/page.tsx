"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, Input, Label } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { Service } from "@/lib/api-types";

/** Form state; money and minutes stay strings while the user types. */
interface Draft {
  id: string | null;
  nameFr: string;
  nameEn: string;
  durationMin: string;
  price: string;
  bufferMin: string;
}

const EMPTY_DRAFT: Draft = {
  id: null,
  nameFr: "",
  nameEn: "",
  durationMin: "30",
  price: "25",
  bufferMin: "0",
};

function draftFrom(service: Service): Draft {
  return {
    id: service.id,
    nameFr: service.nameFr,
    nameEn: service.nameEn,
    durationMin: String(service.durationMin),
    price: (service.priceCents / 100).toFixed(2),
    bufferMin: String(service.bufferMin),
  };
}

/**
 * Services CRUD. Without at least one service nothing can be booked, so this is
 * the first stop when a salon goes live.
 */
export default function ServicesPage() {
  const t = useTranslations("dashboard.services");
  const tc = useTranslations("dashboard.common");
  const { data, loading, error, reload } = useApiData<Service[]>("/services");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [failure, setFailure] = useState(false);

  if (loading || !data) {
    return <p className="text-muted-foreground">{tc("loading")}…</p>;
  }

  const services = data.filter((service) => service.active !== false);
  const removed = data.filter((service) => service.active === false);

  /** Creates or updates the drafted service, then refreshes the list. */
  async function save() {
    if (!draft) {
      return;
    }
    const payload = {
      nameFr: draft.nameFr.trim(),
      nameEn: (draft.nameEn.trim() || draft.nameFr).trim(),
      durationMin: Number(draft.durationMin),
      priceCents: Math.round(Number(draft.price) * 100),
      bufferMin: Number(draft.bufferMin),
    };
    if (!payload.nameFr || !Number.isFinite(payload.durationMin) || payload.durationMin <= 0) {
      setFailure(true);
      return;
    }

    try {
      if (draft.id) {
        await apiFetch(`/services/${draft.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/services", { method: "POST", body: JSON.stringify(payload) });
      }
      setDraft(null);
      setFailure(false);
      reload();
    } catch {
      setFailure(true);
    }
  }

  /** Soft delete: the service stays on past appointments but leaves the menu. */
  async function remove(id: string) {
    try {
      await apiFetch(`/services/${id}`, { method: "DELETE" });
      reload();
    } catch {
      setFailure(true);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setDraft(draft ? null : { ...EMPTY_DRAFT })}>
          {draft ? tc("cancel") : t("add")}
        </Button>
      </div>

      {error || failure ? <p className="text-destructive mt-4 text-sm">{tc("error")}</p> : null}

      {draft ? (
        <Card className="mt-6">
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nameFr">{t("nameFr")}</Label>
                <Input
                  id="nameFr"
                  value={draft.nameFr}
                  onChange={(e) => setDraft({ ...draft, nameFr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameEn">{t("nameEn")}</Label>
                <Input
                  id="nameEn"
                  value={draft.nameEn}
                  onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{t("duration")}</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  step={5}
                  value={draft.durationMin}
                  onChange={(e) => setDraft({ ...draft, durationMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t("price")}</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.5"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buffer">{t("buffer")}</Label>
                <Input
                  id="buffer"
                  type="number"
                  min={0}
                  step={5}
                  value={draft.bufferMin}
                  onChange={(e) => setDraft({ ...draft, bufferMin: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>{tc("save")}</Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                {tc("cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 space-y-3">
        {services.length === 0 && !draft ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {t("empty")}
          </p>
        ) : null}

        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <p className="font-semibold">{service.nameFr}</p>
                <p className="text-muted-foreground text-sm">
                  {service.durationMin} min · {service.nameEn}
                  {service.bufferMin > 0 ? ` · +${service.bufferMin} min` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-primary font-semibold">
                  {(service.priceCents / 100).toFixed(2)} €
                </p>
                <Button size="sm" variant="outline" onClick={() => setDraft(draftFrom(service))}>
                  {tc("edit")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(service.id)}>
                  {tc("remove")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {removed.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-muted-foreground text-sm font-semibold">{t("inactive")}</h2>
          <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
            {removed.map((service) => (
              <li key={service.id} className="flex items-center justify-between gap-3">
                <span className="line-through">{service.nameFr}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await apiFetch(`/services/${service.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ active: true }),
                    });
                    reload();
                  }}
                >
                  {tc("edit")}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
