import Stripe from "stripe";

import type { Plan } from "@bookedforreal/db";

import { priceIdFor } from "./plans";

/** Stripe client (throws at runtime in production if the key is missing). */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy");

export interface CheckoutParams {
  salonId: string;
  customerEmail: string;
  plan: Plan;
  baseUrl: string;
}

/** Creates a Stripe Checkout session for a subscription and returns its URL. */
export async function createCheckoutSession(params: CheckoutParams): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.customerEmail,
    line_items: [{ price: priceIdFor(params.plan), quantity: 1 }],
    success_url: `${params.baseUrl}/dashboard?checkout=success`,
    cancel_url: `${params.baseUrl}/settings?checkout=cancelled`,
    metadata: { salonId: params.salonId, plan: params.plan },
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
