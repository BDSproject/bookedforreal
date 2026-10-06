import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { checkoutSchema } from "@bookedforreal/types";

import { createCheckoutSession, createPortalSession, verifyWebhookEvent } from "../lib/stripe";
import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { syncSubscriptionFromEvent } from "../services/billing";

function webAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Authenticated billing endpoints (prefix /billing). */
export async function billingRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon] };

  // POST /billing/checkout — starts a Stripe Checkout session for a plan.
  app.post("/checkout", guard, async (request, reply) => {
    const parsed = checkoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid plan", details: parsed.error.issues });
    }

    const salon = await prisma.salon.findUnique({
      where: { id: request.salon!.id },
      select: { trialEndsAt: true },
    });

    const url = await createCheckoutSession({
      salonId: request.salon!.id,
      customerEmail: request.user!.email,
      plan: parsed.data.plan,
      interval: parsed.data.interval,
      baseUrl: webAppUrl(),
      trialEndsAt: salon?.trialEndsAt ?? null,
    });

    return { url };
  });

  // POST /billing/portal — opens the Stripe Customer Portal.
  app.post("/portal", guard, async (request, reply) => {
    const salon = await prisma.salon.findUnique({
      where: { id: request.salon!.id },
      select: { stripeCustomerId: true },
    });
    if (!salon?.stripeCustomerId) {
      return reply.code(400).send({ error: "No Stripe customer yet" });
    }

    const url = await createPortalSession(salon.stripeCustomerId, webAppUrl());
    return { url };
  });
}

/** Public Stripe webhook (prefix /webhooks). */
export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // POST /webhooks/stripe — verifies the signature and syncs the subscription.
  app.post("/stripe", { config: { rawBody: true } }, async (request, reply) => {
    const signatureHeader = request.headers["stripe-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) {
      return reply.code(400).send({ error: "Missing stripe-signature" });
    }

    // `fastify-raw-body` exposes the raw body at runtime (config.rawBody = true).
    const rawBody = (request as unknown as { rawBody?: string | Buffer }).rawBody ?? "";

    let event;
    try {
      event = verifyWebhookEvent(rawBody, signature);
    } catch {
      return reply.code(400).send({ error: "Invalid signature" });
    }

    await syncSubscriptionFromEvent(event);
    return { received: true };
  });
}
