import { describe, expect, it } from "vitest";

import { PLANS, priceIdFor } from "./plans";

describe("plans", () => {
  it("defines STARTER quotas", () => {
    expect(PLANS.STARTER.monthlyAppointments).toBe(30);
    expect(PLANS.STARTER.maxStaff).toBe(1);
    expect(PLANS.STARTER.smsWhatsAppCredits).toBe(0);
    expect(PLANS.STARTER.customDomain).toBe(false);
  });

  it("defines PRO quotas", () => {
    expect(PLANS.PRO.monthlyAppointments).toBe(300);
    expect(PLANS.PRO.maxStaff).toBe(5);
    expect(PLANS.PRO.smsWhatsAppCredits).toBe(100);
    expect(PLANS.PRO.customDomain).toBe(true);
  });

  it("returns a price id per plan", () => {
    expect(priceIdFor("STARTER")).toBeTruthy();
    expect(priceIdFor("PRO")).toBeTruthy();
  });
});
