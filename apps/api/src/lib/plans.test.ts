import { describe, expect, it } from "vitest";

import { PLANS, priceIdFor } from "./plans";

describe("plans", () => {
  it("defines STARTER quotas", () => {
    expect(PLANS.STARTER.monthlyAppointments).toBe(80);
    expect(PLANS.STARTER.maxStaff).toBe(1);
    expect(PLANS.STARTER.smsWhatsAppCredits).toBe(0);
    expect(PLANS.STARTER.customDomain).toBe(false);
  });

  it("defines PRO quotas", () => {
    expect(PLANS.PRO.monthlyAppointments).toBe(400);
    expect(PLANS.PRO.maxStaff).toBe(5);
    expect(PLANS.PRO.smsWhatsAppCredits).toBe(50);
    expect(PLANS.PRO.customDomain).toBe(true);
  });

  it("returns a price id per plan", () => {
    expect(priceIdFor("STARTER")).toBeTruthy();
    expect(priceIdFor("PRO")).toBeTruthy();
  });
});
