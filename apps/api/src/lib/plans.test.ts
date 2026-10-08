import { describe, expect, it } from "vitest";

import { PLANS, PLAN_ORDER, SELF_SERVE_PLANS, priceIdFor, USAGE_FEE_CENTS } from "./plans";

describe("plans", () => {
  it("defines USAGE quotas (no booking cap, pay-as-you-go)", () => {
    expect(PLANS.USAGE.monthlyAppointments).toBeGreaterThan(10_000);
    expect(PLANS.USAGE.maxStaff).toBe(1);
    expect(PLANS.USAGE.smsWhatsAppCredits).toBe(50);
    expect(PLANS.USAGE.customDomain).toBe(false);
  });

  it("defines SOLO quotas", () => {
    expect(PLANS.SOLO.monthlyAppointments).toBe(80);
    expect(PLANS.SOLO.maxStaff).toBe(1);
    expect(PLANS.SOLO.smsWhatsAppCredits).toBe(100);
    expect(PLANS.SOLO.customDomain).toBe(false);
  });

  it("defines SALON quotas", () => {
    expect(PLANS.SALON.monthlyAppointments).toBe(400);
    expect(PLANS.SALON.maxStaff).toBe(5);
    expect(PLANS.SALON.smsWhatsAppCredits).toBe(400);
    expect(PLANS.SALON.customDomain).toBe(true);
  });

  it("defines GROUP quotas (multi-shop)", () => {
    expect(PLANS.GROUP.monthlyAppointments).toBeGreaterThan(10_000);
    expect(PLANS.GROUP.maxStaff).toBeGreaterThan(100);
    expect(PLANS.GROUP.smsWhatsAppCredits).toBeGreaterThanOrEqual(2000);
    expect(PLANS.GROUP.customDomain).toBe(true);
  });

  it("gives every plan a WhatsApp/SMS quota so reminders always work", () => {
    for (const plan of PLAN_ORDER) {
      expect(PLANS[plan].smsWhatsAppCredits).toBeGreaterThan(0);
    }
  });

  it("reserves the WhatsApp channel to Solo and above", () => {
    expect(PLANS.USAGE.whatsappReminders).toBe(false);
    expect(PLANS.SOLO.whatsappReminders).toBe(true);
    expect(PLANS.SALON.whatsappReminders).toBe(true);
    expect(PLANS.GROUP.whatsappReminders).toBe(true);
  });

  it("exposes the pay-as-you-go fee in cents (0,50 €)", () => {
    expect(USAGE_FEE_CENTS).toBe(50);
  });

  it("orders plans from entry to group", () => {
    expect(PLAN_ORDER).toEqual(["USAGE", "SOLO", "SALON", "GROUP"]);
    expect(SELF_SERVE_PLANS).toEqual(["USAGE", "SOLO", "SALON"]);
  });

  it("returns a price id per plan and interval", () => {
    for (const plan of PLAN_ORDER) {
      expect(priceIdFor(plan)).toBeTruthy();
      expect(priceIdFor(plan, "yearly")).toBeTruthy();
    }
  });
});
