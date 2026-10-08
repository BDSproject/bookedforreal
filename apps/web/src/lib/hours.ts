/** Opening-hours formatting, shared by the salon mini-site. */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AvailabilityWindow {
  staffId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface WeekdayHours {
  weekday: Weekday;
  windows: AvailabilityWindow[];
}

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

/** Groups windows by weekday, Monday first. */
export function weeklyHours(rows: AvailabilityWindow[]): WeekdayHours[] {
  const byDay = new Map<number, AvailabilityWindow[]>();
  for (const row of rows) {
    byDay.set(row.weekday, [...(byDay.get(row.weekday) ?? []), row]);
  }

  return WEEKDAYS.map((weekday) => ({
    weekday,
    windows: (byDay.get(weekday) ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));
}

/** Formats one window as `09:00 – 18:00`, with the lunch break when present. */
export function windowLabel(window: AvailabilityWindow, breakWord: string): string {
  const base = `${window.startTime} – ${window.endTime}`;
  if (window.breakStart && window.breakEnd) {
    return `${base} (${breakWord} ${window.breakStart} – ${window.breakEnd})`;
  }
  return base;
}
