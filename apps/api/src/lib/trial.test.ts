import { describe, expect, it } from "vitest";

import { hasAccess, trialDaysLeft, trialEndDate, TRIAL_DAYS } from "./trial";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

describe("trial", () => {
  it("runs for 7 days", () => {
    expect(TRIAL_DAYS).toBe(7);
    expect(trialEndDate(NOW).getTime() - NOW).toBe(7 * DAY);
  });

  it("counts the whole days left, rounding up", () => {
    expect(trialDaysLeft(new Date(NOW + 7 * DAY), NOW)).toBe(7);
    expect(trialDaysLeft(new Date(NOW + 3.5 * DAY), NOW)).toBe(4);
    expect(trialDaysLeft(new Date(NOW - DAY), NOW)).toBe(0);
    expect(trialDaysLeft(null, NOW)).toBe(0);
  });

  it("grants access during the trial, without any subscription", () => {
    expect(hasAccess({ trialEndsAt: new Date(NOW + DAY), subscriptionStatus: null }, NOW)).toBe(true);
  });

  it("denies access once the trial has ended", () => {
    expect(hasAccess({ trialEndsAt: new Date(NOW - DAY), subscriptionStatus: null }, NOW)).toBe(false);
    // No trial at all and no subscription → no access.
    expect(hasAccess({ trialEndsAt: null, subscriptionStatus: null }, NOW)).toBe(false);
  });

  it("grants access with an active subscription, even after the trial", () => {
    const expired = new Date(NOW - 30 * DAY);
    expect(hasAccess({ trialEndsAt: expired, subscriptionStatus: "ACTIVE" }, NOW)).toBe(true);
    expect(hasAccess({ trialEndsAt: expired, subscriptionStatus: "TRIALING" }, NOW)).toBe(true);
    expect(hasAccess({ trialEndsAt: expired, subscriptionStatus: "CANCELED" }, NOW)).toBe(false);
    expect(hasAccess({ trialEndsAt: expired, subscriptionStatus: "PAST_DUE" }, NOW)).toBe(false);
  });
});
