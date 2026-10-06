import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { updateSalonSchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { hasAccess, trialDaysLeft } from "../lib/trial";

export async function salonRoutes(app: FastifyInstance): Promise<void> {
  // Kept on `[requireAuth, requireSalon]` (no subscription guard) so the app can
  // always read the trial status and the salon can still subscribe once locked.
  const guard = { preHandler: [requireAuth, requireSalon] };

  // GET /salons/me — the current user's salon + trial status.
  app.get("/me", guard, async (request) => {
    const salon = await prisma.salon.findUnique({ where: { id: request.salon!.id } });
    const trial = {
      daysLeft: trialDaysLeft(salon?.trialEndsAt),
      expired: !hasAccess({
        trialEndsAt: salon?.trialEndsAt ?? null,
        subscriptionStatus: request.salon!.subscriptionStatus,
      }),
    };
    return { salon, trial };
  });

  // PATCH /salons/me — update the salon profile.
  app.patch("/me", guard, async (request, reply) => {
    const parsed = updateSalonSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const salon = await prisma.salon.update({ where: { id: request.salon!.id }, data: parsed.data });
    return { salon };
  });
}
