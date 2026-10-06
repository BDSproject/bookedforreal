import type { Plan } from "@bookedforreal/db";

/** Subscription plans and their quotas. */
export interface PlanDefinition {
  monthlyAppointments: number;
  maxStaff: number;
  /** WhatsApp/SMS messages included per month (1 credit = 1 message sent). */
  smsWhatsAppCredits: number;
  customDomain: boolean;
}

/** Quota value that effectively means "no limit". */
const UNLIMITED = 1_000_000;

/** Display order used by the marketing pages. */
export const PLAN_ORDER: Plan[] = ["USAGE", "SOLO", "SALON", "GROUP"];

/** Plans a customer can subscribe to on their own (GROUP is quoted by sales). */
export const SELF_SERVE_PLANS: Plan[] = ["USAGE", "SOLO", "SALON"];

export const PLANS: Record<Plan, PlanDefinition> = {
  USAGE: {
    monthlyAppointments: UNLIMITED,
    maxStaff: 1,
    smsWhatsAppCredits: 50,
    customDomain: false,
  },
  SOLO: {
    monthlyAppointments: 80,
    maxStaff: 1,
    smsWhatsAppCredits: 100,
    customDomain: false,
  },
  SALON: {
    monthlyAppointments: 400,
    maxStaff: 5,
    smsWhatsAppCredits: 400,
    customDomain: true,
  },
  GROUP: {
    monthlyAppointments: UNLIMITED,
    maxStaff: UNLIMITED,
    smsWhatsAppCredits: 2000,
    customDomain: true,
  },
};

/** Pay-as-you-go fee per booking, in cents (0,50 €). */
export const USAGE_FEE_CENTS = 50;

/** Env var holding the Stripe price id, per plan and billing interval. */
const PRICE_ENV: Record<Plan, { monthly: string; yearly: string }> = {
  USAGE: { monthly: "STRIPE_PRICE_USAGE", yearly: "STRIPE_PRICE_USAGE" },
  SOLO: { monthly: "STRIPE_PRICE_SOLO", yearly: "STRIPE_PRICE_SOLO_YEARLY" },
  SALON: { monthly: "STRIPE_PRICE_SALON", yearly: "STRIPE_PRICE_SALON_YEARLY" },
  GROUP: { monthly: "STRIPE_PRICE_GROUP", yearly: "STRIPE_PRICE_GROUP" },
};

/**
 * Stripe price id for a plan and billing interval (set via env in production).
 * USAGE uses a single metered price, so both intervals point at the same id.
 */
export function priceIdFor(plan: Plan, interval: "monthly" | "yearly" = "monthly"): string {
  return process.env[PRICE_ENV[plan][interval]] ?? `price_${plan.toLowerCase()}_test`;
}
