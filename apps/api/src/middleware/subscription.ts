import type { FastifyReply, FastifyRequest } from "fastify";

import { hasAccess } from "../lib/trial";

/**
 * Pre-handler (run AFTER `requireSalon`) that locks the tenant's features once
 * the 7-day free trial has ended and no subscription is active.
 *
 * Billing, profile (`/salons/me`) and auth routes deliberately stay open so the
 * salon can subscribe and recover its data.
 */
export async function requireActiveSubscription(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const salon = request.salon;
  if (!salon) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  if (hasAccess(salon)) {
    return;
  }

  return reply.code(402).send({
    error: "TRIAL_EXPIRED",
    message: "Your 7-day free trial has ended — subscribe to keep using Bookedforreal.",
  });
}
