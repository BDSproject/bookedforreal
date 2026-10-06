import { describe, expect, it } from "vitest";

import { remainingTrialDays } from "./stripe";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

describe("remainingTrialDays", () => {
  it("returns 0 when the salon has no trial", () => {
    expect(remainingTrialDays(null, NOW)).toBe(0);
    expect(remainingTrialDays(undefined, NOW)).toBe(0);
  });

  it("returns the full 7 days for a fresh trial", () => {
    expect(remainingTrialDays(new Date(NOW + 7 * DAY), NOW)).toBe(7);
  });

  it("rounds partial days up so no free day is lost", () => {
    expect(remainingTrialDays(new Date(NOW + 3.5 * DAY), NOW)).toBe(4);
  });

  it("returns 0 once the trial has ended", () => {
    expect(remainingTrialDays(new Date(NOW - DAY), NOW)).toBe(0);
  });
});
