"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button, Card, CardContent, Input } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { Availability, Staff } from "@/lib/api-types";

/** A window being edited; `id` is null until it has been saved once. */
interface Window {
  id: string | null;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

/** Displayed Monday first: a salon week almost always starts there. */
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;

/** 0 = Sunday … 6 = Saturday, matching the API. */
type Weekday = (typeof WEEKDAYS)[number];

/**
 * weekday → its windows, in chronological order.
 * Keyed by `number` because the API stores the weekday as a plain integer.
 */
type Week = Record<number, Window[]>;

const DEFAULT_WINDOW: Window = {
  id: null,
  startTime: "09:00",
  endTime: "18:00",
  breakStart: "",
  breakEnd: "",
};

/** Builds the editable week of one staff member out of the flat availability rows. */
function weekFor(rows: Availability[], staffId: string): Week {
  const week: Week = {};
  for (const weekday of WEEKDAYS) {
    week[weekday] = [];
  }

  for (const row of rows) {
    if (row.staffId !== staffId) {
      continue;
    }
    week[row.weekday]?.push({
      id: row.id,
      startTime: row.startTime,
      endTime: row.endTime,
      breakStart: row.breakStart ?? "",
      breakEnd: row.breakEnd ?? "",
    });
  }

  for (const weekday of WEEKDAYS) {
    week[weekday]?.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return week;
}

/**
 * Weekly opening hours, per staff member. This is the last step of going live:
 * a weekday without a window offers no slot on the public booking page.
 */
export default function AvailabilityPage() {
  const t = useTranslations("dashboard.availability");
  const tc = useTranslations("dashboard.common");
  const { data: staffList, loading: staffLoading } = useApiData<Staff[]>("/staff");
  const { data: rows, loading: rowsLoading, reload } = useApiData<Availability[]>("/availability");

  const staff = useMemo(() => (staffList ?? []).filter((member) => member.active), [staffList]);
  const [staffId, setStaffId] = useState("");
  const [week, setWeek] = useState<Week | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState(false);

  // Default to the first member and follow the list when it changes.
  useEffect(() => {
    if (staff.length === 0) {
      setStaffId("");
      return;
    }
    if (!staff.some((member) => member.id === staffId)) {
      setStaffId(staff[0]?.id ?? "");
    }
  }, [staff, staffId]);

  // Rebuild the form whenever the selection changes or the saved rows come back.
  useEffect(() => {
    if (!staffId || !rows) {
      return;
    }
    setWeek(weekFor(rows, staffId));
  }, [staffId, rows]);

  if (staffLoading || rowsLoading) {
    return <p className="text-muted-foreground">{tc("loading")}…</p>;
  }

  if (staff.length === 0) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-6 rounded-xl border border-dashed p-6 text-center text-sm">
          {t("noStaff")}
        </p>
      </div>
    );
  }

  if (!week) {
    return <p className="text-muted-foreground">{tc("loading")}…</p>;
  }

  const setDay = (weekday: Weekday, windows: Window[]) =>
    setWeek((current) => (current ? { ...current, [weekday]: windows } : current));

  const addWindow = (weekday: Weekday) => {
    const current = week[weekday] ?? [];
    const last = current[current.length - 1];
    // Chain the new window after the last one, so a split day is quick to type.
    setDay(weekday, [
      ...current,
      last
        ? { ...DEFAULT_WINDOW, startTime: last.endTime, endTime: "19:00" }
        : { ...DEFAULT_WINDOW },
    ]);
  };

  const updateWindow = (weekday: Weekday, index: number, patch: Partial<Window>) =>
    setDay(
      weekday,
      (week[weekday] ?? []).map((window, position) =>
        position === index ? { ...window, ...patch } : window,
      ),
    );

  const removeWindow = (weekday: Weekday, index: number) =>
    setDay(
      weekday,
      (week[weekday] ?? []).filter((_window, position) => position !== index),
    );

  /** Copies one day onto the six others — the usual "same hours every day" case. */
  const copyToAll = (weekday: Weekday) => {
    const source = (week[weekday] ?? []).map((window) => ({ ...window, id: null }));
    if (source.length === 0) {
      return;
    }

    const next: Week = {};
    for (const day of WEEKDAYS) {
      next[day] = day === weekday ? (week[weekday] ?? []) : source.map((window) => ({ ...window }));
    }
    setWeek(next);
  };

  /** Persists the week: creates new windows, updates saved ones, deletes the rest. */
  async function save() {
    setSaving(true);
    setFailure(false);
    try {
      const saved = (rows ?? []).filter((row) => row.staffId === staffId);
      const kept = new Set<string>();

      for (const weekday of WEEKDAYS) {
        for (const window of week?.[weekday] ?? []) {
          const body = {
            staffId,
            weekday,
            startTime: window.startTime,
            endTime: window.endTime,
            breakStart: window.breakStart || null,
            breakEnd: window.breakEnd || null,
          };

          if (window.id) {
            kept.add(window.id);
            await apiFetch(`/availability/${window.id}`, {
              method: "PATCH",
              body: JSON.stringify(body),
            });
          } else {
            await apiFetch("/availability", { method: "POST", body: JSON.stringify(body) });
          }
        }
      }

      // A window removed from the grid disappears from the database.
      for (const row of saved) {
        if (!kept.has(row.id)) {
          await apiFetch(`/availability/${row.id}`, { method: "DELETE" });
        }
      }

      reload();
    } catch {
      setFailure(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>

      {staff.length > 1 ? (
        <div className="mt-6">
          <p className="text-muted-foreground text-sm font-semibold">{t("staff")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {staff.map((member) => (
              <Button
                key={member.id}
                size="sm"
                variant={member.id === staffId ? "default" : "outline"}
                onClick={() => setStaffId(member.id)}
              >
                {member.name}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {failure ? <p className="text-destructive mt-4 text-sm">{tc("error")}</p> : null}

      <div className="mt-6 space-y-3">
        {WEEKDAYS.map((weekday) => {
          const windows = week[weekday] ?? [];
          return (
            <Card key={weekday}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{t(`days.${weekday}`)}</p>
                  <div className="flex gap-2">
                    {windows.length > 0 ? (
                      <Button size="sm" variant="ghost" onClick={() => copyToAll(weekday)}>
                        {t("copyToAll")}
                      </Button>
                    ) : null}
                    <Button size="sm" variant="outline" onClick={() => addWindow(weekday)}>
                      {t("addWindow")}
                    </Button>
                  </div>
                </div>

                {windows.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("closedHint")}</p>
                ) : null}

                {windows.map((window, index) => (
                  <div
                    key={window.id ?? `new-${index}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
                  >
                    <Input
                      type="time"
                      aria-label={t("startTime")}
                      className="w-28"
                      value={window.startTime}
                      onChange={(e) => updateWindow(weekday, index, { startTime: e.target.value })}
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      type="time"
                      aria-label={t("endTime")}
                      className="w-28"
                      value={window.endTime}
                      onChange={(e) => updateWindow(weekday, index, { endTime: e.target.value })}
                    />

                    {window.breakStart || window.breakEnd ? (
                      <>
                        <span className="text-muted-foreground text-sm">{t("break")}</span>
                        <Input
                          type="time"
                          aria-label={t("break")}
                          className="w-28"
                          value={window.breakStart}
                          onChange={(e) =>
                            updateWindow(weekday, index, { breakStart: e.target.value })
                          }
                        />
                        <span className="text-muted-foreground">→</span>
                        <Input
                          type="time"
                          aria-label={t("break")}
                          className="w-28"
                          value={window.breakEnd}
                          onChange={(e) =>
                            updateWindow(weekday, index, { breakEnd: e.target.value })
                          }
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateWindow(weekday, index, { breakStart: "", breakEnd: "" })
                          }
                        >
                          {t("removeBreak")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateWindow(weekday, index, { breakStart: "12:30", breakEnd: "14:00" })
                        }
                      >
                        {t("addBreak")}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      onClick={() => removeWindow(weekday, index)}
                    >
                      {t("removeWindow")}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <Button disabled={saving} onClick={save}>
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
