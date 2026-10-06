import Stripe from "stripe";

import type { Plan } from "@bookedforreal/db";

import { priceIdFor } from "./plans";

/** Stripe client (throws at runtime in production if the key is missing). */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy");

/** One day in milliseconds (used for trial maths). */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CheckoutParams {
  salonId: string;
  customerEmail: string;
  plan: Plan;
  baseUrl: string;
  /** End of the salon's free trial; the days left become the Stripe trial. */
  trialEndsAt?: Date | null;
}

/** Whole free-trial days still available (0 once the trial has ended). */
export function remainingTrialDays(
  trialEndsAt: Date | null | undefined,
  now: number = Date.now(),
): number {
  if (!trialEndsAt) {
    return 0;
  }
  return Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / MS_PER_DAY));
}

/**
 * Creates a Stripe Checkout session for a subscription and returns its URL.
 * The remaining free-trial days are forwarded to Stripe, so the customer is only
 * charged once the 7-day trial is over — and can cancel from the portal before that.
 */
export async function createCheckoutSession(params: CheckoutParams): Promise<string> {
  const trialDays = remainingTrialDays(params.trialEndsAt);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.customerEmail,
    line_items: [{ price: priceIdFor(params.plan), quantity: 1 }],
    success_url: `${params.baseUrl}/dashboard?checkout=success`,
    cancel_url: `${params.baseUrl}/settings?checkout=cancelled`,
    metadata: { salonId: params.salonId, plan: params.plan },
    ...(trialDays > 0 ? { subscription_data: { trial_period_days: trialDays } } : {}),
  });

  return session.url ?? `${params.baseUrl}/settings`;
}

/** Creates a Stripe Customer Portal session and returns its URL. */
export async function createPortalSession(customerId: string, baseUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/settings`,
  });

  return session.url;
}

/** Verifies a Stripe webhook signature and returns the event. */
export function verifyWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_test_dummy",
  );
}
