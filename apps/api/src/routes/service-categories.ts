import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { createServiceCategorySchema, updateServiceCategorySchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { requireActiveSubscription } from "../middleware/subscription";

/**
 * Price-list sections (prefix /service-categories).
 * Deleting one never deletes a service: the services simply become ungrouped.
 */
export async function serviceCategoryRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon, requireActiveSubscription] };

  app.get("/", guard, async (request) => {
    return prisma.serviceCategory.findMany({
      where: { salonId: request.salon!.id },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { services: true } } },
    });
  });

  app.post("/", guard, async (request, reply) => {
    const parsed = createServiceCategorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const salonId = request.salon!.id;
    const duplicate = await prisma.serviceCategory.findFirst({
      where: { salonId, name: parsed.data.name },
      select: { id: true },
    });
    if (duplicate) {
      return reply.code(409).send({ error: "CATEGORY_EXISTS" });
    }

    const category = await prisma.serviceCategory.create({ data: { ...parsed.data, salonId } });
    return reply.code(201).send(category);
  });

  app.patch<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const parsed = updateServiceCategorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const salonId = request.salon!.id;

    if (parsed.data.name) {
      const duplicate = await prisma.serviceCategory.findFirst({
        where: { salonId, name: parsed.data.name, id: { not: request.params.id } },
        select: { id: true },
      });
      if (duplicate) {
        return reply.code(409).send({ error: "CATEGORY_EXISTS" });
      }
    }

    const updated = await prisma.serviceCategory.updateMany({
      where: { id: request.params.id, salonId },
      data: parsed.data,
    });
    if (updated.count === 0) {
      return reply.code(404).send({ error: "Category not found" });
    }

    return prisma.serviceCategory.findUnique({ where: { id: request.params.id } });
  });

  // Removing a section leaves its services in place, just ungrouped.
  app.delete<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const deleted = await prisma.serviceCategory.deleteMany({
      where: { id: request.params.id, salonId: request.salon!.id },
    });
    if (deleted.count === 0) {
      return reply.code(404).send({ error: "Category not found" });
    }
    return { ok: true };
  });
}
