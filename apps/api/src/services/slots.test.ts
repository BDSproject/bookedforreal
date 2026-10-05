import { describe, expect, it } from "vitest";

import { dayRangeUtc, generateSlots, weekdayOfDate } from "./slots";

const TZ = "Europe/Paris";
const DATE = "2026-01-05"; // a Monday

/** "HH:mm" Paris wall-clock on DATE, converted to UTC (Paris = UTC+1 in January). */
function utc(time: string): Date {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return new Date(Date.UTC(2026, 0, 5, h - 1, m));
}

describe("weekdayOfDate", () => {
  it("returns 1 for a Monday", () => {
    expect(weekdayOfDate(DATE)).toBe(1);
  });
});

describe("dayRangeUtc", () => {
  it("returns a 24h range in the salon timezone", () => {
    const { start, end } = dayRangeUtc(DATE, TZ);
    expect(end.getTime() - start.getTime()).toBe(24 * 3600 * 1000);
  });
});

describe("generateSlots", () => {
  const base = {
    date: DATE,
    timezone: TZ,
    startTime: "09:00",
    endTime: "10:00",
    breakStart: null,
    breakEnd: null,
    durationMin: 30,
    bufferMin: 5,
    occupied: [],
  };

  it("generates 30-min slots every 15 min that fit before closing", () => {
    const slots = generateSlots(base);
    // 09:00..10:00; latest start is 09:25 (30min + 5min buffer) => 09:00, 09:15.
    expect(slots.map((s) => s.time)).toEqual(["09:00", "09:15"]);
  });

  it("emits UTC instants matching the salon timezone", () => {
    const [slot] = generateSlots(base);
    expect(slot!.time).toBe("09:00");
    expect(slot!.startAt).toBe("2026-01-05T08:00:00.000Z");
  });

  it("excludes slots inside the break window", () => {
    const slots = generateSlots({ ...base, endTime: "14:00", breakStart: "12:00", breakEnd: "13:00" });
    const times = slots.map((s) => s.time);

    expect(times).toContain("11:45");
    expect(times).toContain("13:00");
    expect(times).not.toContain("12:00");
    expect(times).not.toContain("12:45");
  });

  it("excludes occupied intervals including their buffer", () => {
    // Appointment 10:00–10:30 (Paris) with 5min buffer blocks 10:00–10:35.
    const occupied = [{ startAt: utc("10:00"), endAt: utc("10:30"), bufferMin: 5 }];
    const slots = generateSlots({ ...base, endTime: "12:00", occupied });
    const times = slots.map((s) => s.time);

    expect(times).toContain("09:30");
    expect(times).toContain("10:45");
    expect(times).not.toContain("09:45");
    expect(times).not.toContain("10:00");
    expect(times).not.toContain("10:15");
    expect(times).not.toContain("10:30");
  });

  it("returns no slots when the whole window is occupied", () => {
    const occupied = [{ startAt: utc("09:00"), endAt: utc("10:00"), bufferMin: 0 }];
    expect(generateSlots({ ...base, occupied })).toEqual([]);
  });
});
