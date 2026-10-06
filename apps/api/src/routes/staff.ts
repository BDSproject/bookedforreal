import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { createStaffSchema, updateStaffSchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { requireActiveSubscription } from "../middleware/subscription";

export async function staffRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon, requireActiveSubscription] };

  app.get("/", guard, async (request) => {
    return prisma.staff.findMany({
      where: { salonId: request.salon!.id },
      orderBy: [{ active: "desc" }, { order: "asc" }],
    });
  });

  app.post("/", guard, async (request, reply) => {
    const parsed = createStaffSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const staff = await prisma.staff.create({ data: { ...parsed.data, salonId: request.salon!.id } });
    return reply.code(201).send(staff);
  });

  app.patch<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const parsed = updateStaffSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const updated = await prisma.staff.updateMany({
      where: { id: request.params.id, salonId: request.salon!.id },
      data: parsed.data,
    });
    if (updated.count === 0) {
      return reply.code(404).send({ error: "Staff not found" });
    }

    return prisma.staff.findUnique({ where: { id: request.params.id } });
  });

  // Soft delete (keeps appointment history).
  app.delete<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const updated = await prisma.staff.updateMany({
      where: { id: request.params.id, salonId: request.salon!.id },
      data: { active: false },
    });
    if (updated.count === 0) {
      return reply.code(404).send({ error: "Staff not found" });
    }

    return { ok: true };
  });
}
