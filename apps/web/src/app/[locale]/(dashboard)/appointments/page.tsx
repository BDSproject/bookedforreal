"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@bookedforreal/ui";

import { useApiData } from "@/hooks/use-api";
import { apiFetch } from "@/lib/api-client";
import type { Appointment, Staff, TimeBlock } from "@/lib/api-types";
import { addDays, isoDate, minutesOfDay, mondayOf, weekDays } from "@/lib/week";

/** Calendar runs from 08:00 to 20:00, in 30-minute rows. */
const DAY_START_MIN = 8 * 60;
const DAY_END_MIN = 20 * 60;
const SLOT_MIN = 30;
const SLOT_HEIGHT = 28;
const SLOT_COUNT = (DAY_END_MIN - DAY_START_MIN) / SLOT_MIN;

const DAY_NAMES = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."] as const;

/** Tailwind classes per appointment status. */
const STATUS_STYLE: Record<Appointment["status"], string> = {
  PENDING: "bg-amber-100 text-amber-900 border-amber-300",
  CONFIRMED: "bg-violet-100 text-violet-900 border-violet-300",
  DONE: "bg-zinc-100 text-zinc-600 border-zinc-200",
  CANCELLED: "bg-red-50 text-red-500 border-red-200 line-through",
  NO_SHOW: "bg-red-100 text-red-800 border-red-300",
};

/** Converts a time to its grid row (1-based) and span, clamped to the day. */
function gridPosition(start: Date, end: Date): { row: number; span: number } {
  const startMin = Math.max(minutesOfDay(start), DAY_START_MIN);
  const endMin = Math.min(minutesOfDay(end), DAY_END_MIN);
  const row = Math.floor((startMin - DAY_START_MIN) / SLOT_MIN) + 1;
  const span = Math.max(1, Math.round((endMin - startMin) / SLOT_MIN));
  return { row, span };
}

/** `HH:mm` in local time. */
function timeLabel(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * Week calendar: the salon's agenda as a Monday–Sunday grid.
 * Click an empty slot to block it, a blocked slot to free it, and an
 * appointment to confirm / complete / cancel it.
 */
export default function AppointmentsPage() {
  const t = useTranslations("dashboard.calendar");
  const ts = useTranslations("booking.status");

  const { data: staffList } = useApiData<Staff[]>("/staff");
  const staff = useMemo(() => (staffList ?? []).filter((member) => member.active), [staffList]);

  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [staffId, setStaffId] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);

  const days = weekDays(weekStart);
  const sunday = addDays(weekStart, 6);
  const from = isoDate(weekStart);
  const to = isoDate(sunday);

  const activeStaffId = staffId || staff[0]?.id || "";

  const { data: appointments, reload: reloadAppointments } = useApiData<Appointment[]>(
    `/appointments?from=${from}&to=${to}`,
  );
  const { data: blocks, reload: reloadBlocks } = useApiData<TimeBlock[]>(
    `/time-blocks?from=${from}&to=${to}`,
  );

  const dayIndexByIso = useMemo(() => {
    const map = new Map<string, number>();
    days.forEach((day, index) => map.set(isoDate(day), index));
    return map;
  }, [days]);

  /** Appointments and blocks for the selected staff, mapped onto the grid. */
  const rows = useMemo(() => {
    const result: {
      day: number;
      start: Date;
      end: Date;
      kind: "appointment" | "block";
      item: Appointment | TimeBlock;
    }[] = [];

    for (const appointment of appointments ?? []) {
      if (appointment.staff?.id !== activeStaffId) continue;
      const day = dayIndexByIso.get(isoDate(new Date(appointment.startAt)));
      if (day === undefined) continue;
      result.push({
        day,
        start: new Date(appointment.startAt),
        end: new Date(appointment.endAt),
        kind: "appointment",
        item: appointment,
      });
    }

    for (const block of blocks ?? []) {
      if (block.staffId !== activeStaffId) continue;
      const day = dayIndexByIso.get(isoDate(new Date(block.startAt)));
      if (day === undefined) continue;
      result.push({
        day,
        start: new Date(block.startAt),
        end: new Date(block.endAt),
        kind: "block",
        item: block,
      });
    }

    return result;
  }, [appointments, blocks, activeStaffId, dayIndexByIso]);

  /** Blocks a 30-minute slot for the selected staff member. */
  async function blockSlot(dayIndex: number, slotIndex: number) {
    const day = days[dayIndex];
    if (!day || !activeStaffId) return;
    const start = new Date(day);
    start.setHours(0, DAY_START_MIN + slotIndex * SLOT_MIN, 0, 0);
    const end = new Date(start.getTime() + SLOT_MIN * 60_000);
    await apiFetch("/time-blocks", {
      method: "POST",
      body: JSON.stringify({
        staffId: activeStaffId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      }),
    });
    reloadBlocks();
  }

  /** Frees a blocked slot. */
  async function unblock(id: string) {
    await apiFetch(`/time-blocks/${id}`, { method: "DELETE" });
    reloadBlocks();
  }

  /** Confirms / completes / cancels the selected appointment. */
  async function setStatus(status: Appointment["status"]) {
    if (!selected) return;
    await apiFetch(`/appointments/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setSelected(null);
    reloadAppointments();
  }

  if (staff.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("week", { date: "" })}</h1>
        <p className="text-muted-foreground mt-6 rounded-xl border border-dashed p-6 text-center text-sm">
          {t("noStaff")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("week", { date: weekStart.toLocaleDateString() })}
        </h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            ← {t("prev")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setWeekStart(mondayOf(new Date()))}>
            {t("today")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            {t("next")} →
          </Button>
        </div>
      </div>

      {staff.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {staff.map((member) => (
            <Button
              key={member.id}
              size="sm"
              variant={member.id === activeStaffId ? "default" : "outline"}
              onClick={() => {
                setStaffId(member.id);
                setSelected(null);
              }}
            >
              {member.name}
            </Button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <div className="bg-card mt-4 flex flex-wrap items-center gap-2 rounded-xl border p-3">
          <span className="font-medium">
            {selected.client?.name ?? "—"} · {selected.service?.nameFr ?? ""} ·{" "}
            {timeLabel(new Date(selected.startAt))}
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setStatus("CONFIRMED")}>
              {ts("CONFIRMED")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("DONE")}>
              {ts("DONE")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStatus("CANCELLED")}>
              {ts("CANCELLED")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-xs">{t("blockHint")}</p>
      )}

      {/* --- Grid ------------------------------------------------------------ */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day headers */}
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] gap-px">
            <div />
            {days.map((day, index) => (
              <div key={isoDate(day)} className="text-center text-sm font-semibold">
                <span className="block">{DAY_NAMES[index]}</span>
                <span className="text-muted-foreground block text-xs font-normal">
                  {day.toLocaleDateString([], { day: "numeric", month: "numeric" })}
                </span>
              </div>
            ))}
          </div>

          <div
            className="mt-2 grid grid-cols-[56px_repeat(7,minmax(0,1fr))]"
            style={{ gridTemplateRows: `repeat(${SLOT_COUNT}, ${SLOT_HEIGHT}px)` }}
          >
            {/* Time axis */}
            {Array.from({ length: DAY_END_MIN / 60 - DAY_START_MIN / 60 }, (_, index) => (
              <div
                key={index}
                className="text-muted-foreground relative pr-1 text-right text-[10px]"
                style={{ gridColumn: 1, gridRow: `${index * 2 + 1} / span 2` }}
              >
                <span className="absolute -top-1.5 right-1">
                  {String(DAY_START_MIN / 60 + index).padStart(2, "0")}:00
                </span>
              </div>
            ))}

            {/* Background cells (click to block) */}
            {days.map((day, dayIndex) =>
              Array.from({ length: SLOT_COUNT }, (_, slotIndex) => (
                <button
                  key={`${isoDate(day)}-${slotIndex}`}
                  type="button"
                  aria-label={t("blocked")}
                  onClick={() => void blockSlot(dayIndex, slotIndex)}
                  className="hover:bg-accent/60 border-border/40 border-b border-r"
                  style={{ gridColumn: dayIndex + 2, gridRow: slotIndex + 1 }}
                />
              )),
            )}

            {/* Appointments and blocked slots on top */}
            {rows.map(({ day, start, end, kind, item }) => {
              const { row, span } = gridPosition(start, end);
              const column = day + 2;

              if (kind === "block") {
                return (
                  <button
                    key={`block-${item.id}`}
                    type="button"
                    onClick={() => void unblock(item.id)}
                    title={(item as TimeBlock).label ?? t("blocked")}
                    className="z-10 m-0.5 rounded border border-zinc-400 bg-zinc-300 px-1 text-left text-[10px] text-zinc-600 hover:bg-zinc-400"
                    style={{ gridColumn: column, gridRow: `${row} / span ${span}` }}
                  >
                    {(item as TimeBlock).label ?? t("blocked")}
                  </button>
                );
              }

              const appointment = item as Appointment;
              return (
                <button
                  key={`appointment-${appointment.id}`}
                  type="button"
                  onClick={() => setSelected(appointment)}
                  className={`z-10 m-0.5 overflow-hidden rounded border px-1 text-left text-[11px] leading-tight ${STATUS_STYLE[appointment.status]}`}
                  style={{ gridColumn: column, gridRow: `${row} / span ${span}` }}
                >
                  <span className="block truncate font-semibold">
                    {appointment.client?.name ?? "—"}
                  </span>
                  <span className="block truncate opacity-80">{appointment.service?.nameFr}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-violet-300 bg-violet-100" />
          {ts("CONFIRMED")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-amber-300 bg-amber-100" />
          {ts("PENDING")}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-zinc-300" />
          {t("blocked")}
        </span>
      </div>
    </div>
  );
}
