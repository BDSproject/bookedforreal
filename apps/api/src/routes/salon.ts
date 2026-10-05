import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { updateSalonSchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";

export async function salonRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon] };

  // GET /salons/me — the current user's salon (full record).
  app.get("/me", guard, async (request) => {
    const salon = await prisma.salon.findUnique({ where: { id: request.salon!.id } });
    return { salon };
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
