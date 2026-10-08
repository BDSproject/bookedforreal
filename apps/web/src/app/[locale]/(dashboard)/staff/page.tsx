"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, Input, Label } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { Staff } from "@/lib/api-types";

interface Draft {
  id: string | null;
  name: string;
}

/**
 * Staff CRUD. Opening hours are set per person on the Horaires page, so a salon
 * with a single chair only needs one entry here.
 */
export default function StaffPage() {
  const t = useTranslations("dashboard.staff");
  const tc = useTranslations("dashboard.common");
  const { data, loading, error, reload } = useApiData<Staff[]>("/staff");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [failure, setFailure] = useState(false);

  if (loading || !data) {
    return <p className="text-muted-foreground">{tc("loading")}…</p>;
  }

  const members = data.filter((member) => member.active);
  const removed = data.filter((member) => !member.active);

  async function save() {
    if (!draft) {
      return;
    }
    const name = draft.name.trim();
    if (!name) {
      setFailure(true);
      return;
    }

    try {
      if (draft.id) {
        await apiFetch(`/staff/${draft.id}`, { method: "PATCH", body: JSON.stringify({ name }) });
      } else {
        await apiFetch("/staff", { method: "POST", body: JSON.stringify({ name }) });
      }
      setDraft(null);
      setFailure(false);
      reload();
    } catch {
      setFailure(true);
    }
  }

  /** Soft delete: appointment history keeps pointing at the person. */
  async function remove(id: string) {
    try {
      await apiFetch(`/staff/${id}`, { method: "DELETE" });
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
        <Button onClick={() => setDraft(draft ? null : { id: null, name: "" })}>
          {draft ? tc("cancel") : t("add")}
        </Button>
      </div>

      {error || failure ? <p className="text-destructive mt-4 text-sm">{tc("error")}</p> : null}

      {draft ? (
        <Card className="mt-6">
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="staffName">{t("name")}</Label>
              <Input
                id="staffName"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
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
        {members.length === 0 && !draft ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {t("empty")}
          </p>
        ) : null}

        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <p className="font-semibold">{member.name}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDraft({ id: member.id, name: member.name })}
                >
                  {tc("edit")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(member.id)}>
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
          <ul className="text-muted-foreground mt-2 space-y-2 text-sm">
            {removed.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3">
                <span className="line-through">{member.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await apiFetch(`/staff/${member.id}`, {
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
