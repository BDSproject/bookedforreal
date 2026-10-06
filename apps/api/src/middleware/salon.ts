import type { FastifyReply, FastifyRequest } from "fastify";

import { prisma } from "@bookedforreal/db";

/**
 * Pre-handler (run AFTER `requireAuth`) that resolves the salon owned by the
 * current user and attaches `request.salon`, enforcing multi-tenant scoping.
 *
 * The trial window and subscription status travel with it so the
 * `requireActiveSubscription` guard needs no extra query.
 */
export async function requireSalon(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = request.user;
  if (!user) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  const salon = await prisma.salon.findUnique({
    where: { ownerId: user.id },
    include: { subscription: { select: { status: true } } },
  });
  if (!salon) {
    return reply.code(404).send({ error: "Salon not found" });
  }

  request.salon = {
    id: salon.id,
    slug: salon.slug,
    trialEndsAt: salon.trialEndsAt,
    subscriptionStatus: salon.subscription?.status ?? null,
  };
}
