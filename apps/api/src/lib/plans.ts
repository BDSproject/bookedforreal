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

/** Stripe price ids per plan (set via env in production). */
export function priceIdFor(plan: Plan): string {
  return plan === "PRO"
    ? (process.env.STRIPE_PRICE_PRO ?? "price_pro_test")
    : (process.env.STRIPE_PRICE_STARTER ?? "price_starter_test");
}
