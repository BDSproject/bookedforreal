"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, Input, Label } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { Service, ServiceCategory, Staff } from "@/lib/api-types";
import { groupServices } from "@/lib/service-groups";

/** Form state; money and minutes stay strings while the user types. */
interface Draft {
  id: string | null;
  nameFr: string;
  nameEn: string;
  durationMin: string;
  price: string;
  bufferMin: string;
  categoryId: string;
  /** Empty array means "the whole team". */
  staffIds: string[];
}

const EMPTY_DRAFT: Draft = {
  id: null,
  nameFr: "",
  nameEn: "",
  durationMin: "30",
  price: "25",
  bufferMin: "0",
  categoryId: "",
  staffIds: [],
};

function draftFrom(service: Service): Draft {
  return {
    id: service.id,
    nameFr: service.nameFr,
    nameEn: service.nameEn,
    durationMin: String(service.durationMin),
    price: (service.priceCents / 100).toFixed(2),
    bufferMin: String(service.bufferMin),
    categoryId: service.categoryId ?? "",
    staffIds: (service.staff ?? []).map((member) => member.id),
  };
}

/**
 * Services CRUD, grouped into price-list categories and assignable to specific
 * staff. A service with nobody assigned is open to the whole team.
 */
export default function ServicesPage() {
  const t = useTranslations("dashboard.services");
  const tc = useTranslations("dashboard.common");
  const { data, loading, error, reload } = useApiData<Service[]>("/services");
  const { data: categories, reload: reloadCategories } =
    useApiData<ServiceCategory[]>("/service-categories");
  const { data: team } = useApiData<Staff[]>("/staff");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<{ id: string | null; name: string } | null>(
    null,
  );
  const [failure, setFailure] = useState<string | null>(null);

  if (loading || !data) {
    return <p className="text-muted-foreground">{tc("loading")}…</p>;
  }

  const services = data.filter((service) => service.active !== false);
  const removed = data.filter((service) => service.active === false);
  const groups = groupServices(services);
  const activeTeam = (team ?? []).filter((member) => member.active);
  const categoryList = categories ?? [];

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
      categoryId: draft.categoryId || null,
      staffIds: draft.staffIds,
    };
    if (!payload.nameFr || !Number.isFinite(payload.durationMin) || payload.durationMin <= 0) {
      setFailure(tc("error"));
      return;
    }

    try {
      if (draft.id) {
        await apiFetch(`/services/${draft.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/services", { method: "POST", body: JSON.stringify(payload) });
      }
      setDraft(null);
      setFailure(null);
      reload();
    } catch {
      setFailure(tc("error"));
    }
  }

  /** Soft delete: the service stays on past appointments but leaves the menu. */
  async function remove(id: string) {
    try {
      await apiFetch(`/services/${id}`, { method: "DELETE" });
      reload();
    } catch {
      setFailure(tc("error"));
    }
  }

  /** Creates a category, or renames the one being edited. */
  async function saveCategory() {
    if (!categoryDraft) {
      return;
    }
    const name = categoryDraft.name.trim();
    if (!name) {
      setFailure(tc("error"));
      return;
    }

    try {
      if (categoryDraft.id) {
        await apiFetch(`/service-categories/${categoryDraft.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name }),
        });
      } else {
        await apiFetch("/service-categories", { method: "POST", body: JSON.stringify({ name }) });
      }
      setCategoryDraft(null);
      setFailure(null);
      reloadCategories();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setFailure(message.includes("CATEGORY_EXISTS") ? t("categoryExists") : tc("error"));
    }
  }

  /**
   * Deletes a category. The services it held are kept and become ungrouped,
   * which is why the confirmation stays a single click.
   */
  async function removeCategory(id: string) {
    try {
      await apiFetch(`/service-categories/${id}`, { method: "DELETE" });
      reloadCategories();
      reload();
    } catch {
      setFailure(tc("error"));
    }
  }

  /** Toggles one staff member on the drafted service. */
  function toggleStaff(staffId: string) {
    if (!draft) {
      return;
    }
    setDraft({
      ...draft,
      staffIds: draft.staffIds.includes(staffId)
        ? draft.staffIds.filter((id) => id !== staffId)
        : [...draft.staffIds, staffId],
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setDraft(draft ? null : { ...EMPTY_DRAFT })}>
          {draft ? tc("cancel") : t("add")}
        </Button>
      </div>

      {error || failure ? (
        <p className="text-destructive mt-4 text-sm">{failure ?? tc("error")}</p>
      ) : null}

      {/* --- Price-list sections ------------------------------------------- */}
      <Card className="mt-6">
        <CardContent className="space-y-3 pt-6">
          <div>
            <p className="font-semibold">{t("categories")}</p>
            <p className="text-muted-foreground text-sm">{t("categoriesHint")}</p>
          </div>

          {categoryList.length > 0 ? (
            <ul className="space-y-2">
              {categoryList.map((category) => (
                <li
                  key={category.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <span className="font-medium">
                    {category.name}
                    {category._count ? (
                      <span className="text-muted-foreground ml-2 text-sm">
                        {category._count.services}
                      </span>
                    ) : null}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCategoryDraft({ id: category.id, name: category.name })}
                    >
                      {tc("edit")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeCategory(category.id)}>
                      {tc("remove")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {categoryDraft ? (
            <div className="space-y-2 rounded-lg border p-3">
              <Input
                autoFocus
                value={categoryDraft.name}
                placeholder={t("categoryPlaceholder")}
                onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveCategory}>
                  {tc("save")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCategoryDraft(null)}>
                  {tc("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCategoryDraft({ id: null, name: "" })}
            >
              {t("addCategory")}
            </Button>
          )}

          <p className="text-muted-foreground text-xs">{t("categoryDeletedHint")}</p>
        </CardContent>
      </Card>

      {/* --- Service form --------------------------------------------------- */}
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
              <div className="space-y-2">
                <Label htmlFor="category">{t("category")}</Label>
                <select
                  id="category"
                  value={draft.categoryId}
                  onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                  className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2"
                >
                  <option value="">{t("noCategoryOption")}</option>
                  {categoryList.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("assignedStaff")}</Label>
              {activeTeam.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("allStaff")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeTeam.map((member) => {
                    const selected = draft.staffIds.includes(member.id);
                    return (
                      <Button
                        key={member.id}
                        type="button"
                        size="sm"
                        variant={selected ? "default" : "outline"}
                        onClick={() => toggleStaff(member.id)}
                      >
                        {selected ? "✓ " : ""}
                        {member.name}
                      </Button>
                    );
                  })}
                </div>
              )}
              <p className="text-muted-foreground text-xs">{t("assignedStaffHint")}</p>
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

      {/* --- Price list, grouped -------------------------------------------- */}
      {services.length === 0 && !draft ? (
        <p className="text-muted-foreground mt-6 rounded-xl border border-dashed p-6 text-center text-sm">
          {t("empty")}
        </p>
      ) : null}

      {groups.map((group) => (
        <section key={group.category?.id ?? "ungrouped"} className="mt-8">
          <h2 className="text-muted-foreground text-xs font-bold uppercase tracking-wide">
            {group.category?.name ?? t("noCategory")}
          </h2>
          <div className="mt-3 space-y-3">
            {group.services.map((service) => (
              <Card key={service.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div>
                    <p className="font-semibold">{service.nameFr}</p>
                    <p className="text-muted-foreground text-sm">
                      {service.durationMin} min · {service.nameEn}
                      {service.bufferMin > 0 ? ` · +${service.bufferMin} min` : ""}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {t("team")} :{" "}
                      {service.staff && service.staff.length > 0
                        ? service.staff.map((member) => member.name).join(", ")
                        : t("allStaff")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-primary font-semibold">
                      {(service.priceCents / 100).toFixed(2)} €
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDraft(draftFrom(service))}
                    >
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
        </section>
      ))}

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
