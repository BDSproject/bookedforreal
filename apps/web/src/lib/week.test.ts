import { describe, expect, it } from "vitest";

import { addDays, isoDate, minutesOfDay, mondayOf, weekDays } from "./week";

describe("week helpers", () => {
  it("finds the Monday of a week, including a Sunday", () => {
    const sunday = new Date(2026, 9, 11, 15, 30); // Sunday 2026-10-11
    expect(isoDate(mondayOf(sunday))).toBe("2026-10-05");
  });

  it("keeps a Monday as is", () => {
    const monday = new Date(2026, 9, 12, 8, 0); // Monday 2026-10-12
    expect(isoDate(mondayOf(monday))).toBe("2026-10-12");
  });

  it("returns seven days starting Monday", () => {
    const days = weekDays(new Date(2026, 9, 12));
    expect(days).toHaveLength(7);
    expect(days.map(isoDate)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
      "2026-10-17",
      "2026-10-18",
    ]);
  });

  it("adds days without mutating the input", () => {
    const base = new Date(2026, 9, 12);
    const next = addDays(base, 1);
    expect(isoDate(next)).toBe("2026-10-13");
    expect(isoDate(base)).toBe("2026-10-12");
  });

  it("computes the minutes since midnight", () => {
    expect(minutesOfDay(new Date(2026, 0, 1, 9, 30))).toBe(570);
  });
});
