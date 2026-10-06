import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { createAvailabilitySchema, updateAvailabilitySchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { requireActiveSubscription } from "../middleware/subscription";

export async function availabilityRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon, requireActiveSubscription] };

  app.get("/", guard, async (request) => {
    return prisma.availability.findMany({
      where: { salonId: request.salon!.id },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
  });

  app.post("/", guard, async (request, reply) => {
    const parsed = createAvailabilitySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const availability = await prisma.availability.create({
      data: { ...parsed.data, salonId: request.salon!.id },
    });
    return reply.code(201).send(availability);
  });

  app.patch<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const parsed = updateAvailabilitySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const updated = await prisma.availability.updateMany({
      where: { id: request.params.id, salonId: request.salon!.id },
      data: parsed.data,
    });
    if (updated.count === 0) {
      return reply.code(404).send({ error: "Availability not found" });
    }

    return prisma.availability.findUnique({ where: { id: request.params.id } });
  });

  app.delete<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const deleted = await prisma.availability.deleteMany({
      where: { id: request.params.id, salonId: request.salon!.id },
    });
    if (deleted.count === 0) {
      return reply.code(404).send({ error: "Availability not found" });
    }

    return { ok: true };
  });
}
