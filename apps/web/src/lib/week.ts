/**
 * Small, dependency-free week helpers for the calendar.
 * All dates are treated in the browser's local timezone.
 */

/** Monday 00:00 of the week containing `date`. */
export function mondayOf(date: Date): Date {
  const monday = new Date(date);
  const day = monday.getDay(); // 0 = Sunday … 6 = Saturday
  const daysSinceMonday = (day + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** The seven days of the week, starting on `monday`. */
export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

/** Adds a whole number of days, returning a copy. */
export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** `YYYY-MM-DD` in local time — the format the API expects for `from`/`to`. */
export function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Minutes since midnight, local time. */
export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
