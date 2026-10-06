import type { Plan } from "@bookedforreal/db";

/** Subscription plans and their quotas. */
export interface PlanDefinition {
  monthlyAppointments: number;
  maxStaff: number;
  smsWhatsAppCredits: number;
  customDomain: boolean;
}

export const PLANS: Record<Plan, PlanDefinition> = {
  STARTER: {
    monthlyAppointments: 80,
    maxStaff: 1,
    smsWhatsAppCredits: 0,
    customDomain: false,
  },
  PRO: {
    monthlyAppointments: 400,
    maxStaff: 5,
    smsWhatsAppCredits: 50,
    customDomain: true,
  },
};

/**
 * Stripe price ids per plan and billing interval (set via env in production).
 * `STRIPE_PRICE_*` are the monthly prices; `*_YEARLY` the annual ones.
 */
export function priceIdFor(plan: Plan, interval: "monthly" | "yearly" = "monthly"): string {
  const key =
    plan === "PRO"
      ? interval === "yearly"
        ? "STRIPE_PRICE_PRO_YEARLY"
        : "STRIPE_PRICE_PRO"
      : interval === "yearly"
        ? "STRIPE_PRICE_STARTER_YEARLY"
        : "STRIPE_PRICE_STARTER";

  const fallback = plan === "PRO" ? "price_pro_test" : "price_starter_test";
  return process.env[key] ?? fallback;
}
