import { getDay, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export interface OccupiedInterval {
  startAt: Date;
  endAt: Date;
  bufferMin: number;
}

export interface Slot {
  /** Salon-local wall-clock time, e.g. "09:00". */
  time: string;
  /** ISO 8601 UTC instant to send back when creating the appointment. */
  startAt: string;
}

export interface GenerateSlotsInput {
  date: string; // "YYYY-MM-DD"
  timezone: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  breakStart: string | null;
  breakEnd: string | null;
  durationMin: number;
  bufferMin: number;
  occupied: OccupiedInterval[];
  stepMin?: number;
}

const DEFAULT_STEP_MIN = 15;

/** Converts a "YYYY-MM-DD" + "HH:mm" wall-clock pair in a timezone to a UTC Date. */
function zonedToUtc(date: string, time: string, timezone: string): Date {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  return fromZonedTime(new Date(year, month - 1, day, hour, minute, 0, 0), timezone);
}

/** Day of week (0 = Sunday … 6 = Saturday) for a "YYYY-MM-DD" calendar date. */
export function weekdayOfDate(date: string): number {
  return getDay(parseISO(date));
}

/** UTC [start, end) range covering a full calendar day in the given timezone. */
export function dayRangeUtc(date: string, timezone: string): { start: Date; end: Date } {
  const start = zonedToUtc(date, "00:00", timezone);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const end = fromZonedTime(new Date(year, month - 1, day + 1, 0, 0, 0, 0), timezone);
  return { start, end };
}

/**
 * Generates available start slots (default 15-minute steps) for a service on a
 * given day. Excludes the break window and any occupied interval extended by its
 * buffer.
 */
export function generateSlots(input: GenerateSlotsInput): Slot[] {
  const stepMin = input.stepMin ?? DEFAULT_STEP_MIN;
  const durationMs = input.durationMin * 60_000;
  const bufferMs = input.bufferMin * 60_000;

  const windowStart = zonedToUtc(input.date, input.startTime, input.timezone).getTime();
  const windowEnd = zonedToUtc(input.date, input.endTime, input.timezone).getTime();
  const breakStart = input.breakStart
    ? zonedToUtc(input.date, input.breakStart, input.timezone).getTime()
    : null;
  const breakEnd = input.breakEnd
    ? zonedToUtc(input.date, input.breakEnd, input.timezone).getTime()
    : null;

  const blocked = input.occupied.map((o) => ({
    start: o.startAt.getTime(),
    end: o.endAt.getTime() + o.bufferMin * 60_000,
  }));

  const slots: Slot[] = [];

  for (let t = windowStart; t + durationMs + bufferMs <= windowEnd; t += stepMin * 60_000) {
    const slotEnd = t + durationMs;

    // Skip slots that start inside the break window.
    if (breakStart !== null && breakEnd !== null && t >= breakStart && t < breakEnd) {
      continue;
    }

    // Skip slots overlapping any occupied interval (existing appointment + buffer).
    const overlaps = blocked.some((b) => t < b.end && slotEnd > b.start);
    if (overlaps) {
      continue;
    }

    slots.push({
      time: formatInTimeZone(t, input.timezone, "HH:mm"),
      startAt: new Date(t).toISOString(),
    });
  }

  return slots;
}
