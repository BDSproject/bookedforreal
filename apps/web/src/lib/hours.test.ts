import { describe, expect, it } from "vitest";

import { weeklyHours, windowLabel } from "./hours";

describe("weeklyHours", () => {
  it("orders the days Monday to Sunday", () => {
    const rows = [
      {
        staffId: "s1",
        weekday: 0,
        startTime: "10:00",
        endTime: "14:00",
        breakStart: null,
        breakEnd: null,
      },
      {
        staffId: "s1",
        weekday: 1,
        startTime: "09:00",
        endTime: "18:00",
        breakStart: null,
        breakEnd: null,
      },
    ];
    expect(weeklyHours(rows).map((day) => day.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it("sorts the windows of one day chronologically", () => {
    const rows = [
      {
        staffId: "s1",
        weekday: 1,
        startTime: "14:00",
        endTime: "18:00",
        breakStart: null,
        breakEnd: null,
      },
      {
        staffId: "s1",
        weekday: 1,
        startTime: "09:00",
        endTime: "12:00",
        breakStart: null,
        breakEnd: null,
      },
    ];
    const monday = weeklyHours(rows)[0]!;
    expect(monday.windows.map((w) => w.startTime)).toEqual(["09:00", "14:00"]);
  });

  it("returns empty days for a closed weekday", () => {
    const days = weeklyHours([]);
    expect(days.every((day) => day.windows.length === 0)).toBe(true);
  });
});

describe("windowLabel", () => {
  it("includes the lunch break when present", () => {
    const window = {
      staffId: "s1",
      weekday: 1,
      startTime: "09:00",
      endTime: "18:00",
      breakStart: "12:30",
      breakEnd: "14:00",
    };
    expect(windowLabel(window, "pause")).toBe("09:00 – 18:00 (pause 12:30 – 14:00)");
  });

  it("omits the break when absent", () => {
    const window = {
      staffId: "s1",
      weekday: 1,
      startTime: "09:00",
      endTime: "18:00",
      breakStart: null,
      breakEnd: null,
    };
    expect(windowLabel(window, "pause")).toBe("09:00 – 18:00");
  });
});
