import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { createServiceSchema, updateServiceSchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { requireActiveSubscription } from "../middleware/subscription";

/** Relations returned with every service so the dashboard can edit it in place. */
const SERVICE_INCLUDE = {
  category: true,
  staff: { select: { id: true, name: true } },
} as const;

/**
 * Rejects a category or a staff id that belongs to another salon.
 * Returns an error code, or null when everything checks out.
 */
async function invalidRelation(
  salonId: string,
  categoryId: string | null | undefined,
  staffIds: string[] | undefined,
): Promise<string | null> {
  if (categoryId) {
    const category = await prisma.serviceCategory.findFirst({
      where: { id: categoryId, salonId },
      select: { id: true },
    });
    if (!category) {
      return "Unknown category";
    }
  }

  if (staffIds && staffIds.length > 0) {
    const unique = [...new Set(staffIds)];
    const found = await prisma.staff.count({ where: { id: { in: unique }, salonId } });
    if (found !== unique.length) {
      return "Unknown staff";
    }
  }

  return null;
}

export async function serviceRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon, requireActiveSubscription] };

  app.get("/", guard, async (request) => {
    return prisma.service.findMany({
      where: { salonId: request.salon!.id },
      orderBy: [{ active: "desc" }, { category: { order: "asc" } }, { nameFr: "asc" }],
      include: SERVICE_INCLUDE,
    });
  });

  app.post("/", guard, async (request, reply) => {
    const parsed = createServiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const salonId = request.salon!.id;
    const { staffIds, ...fields } = parsed.data;

    const invalid = await invalidRelation(salonId, fields.categoryId, staffIds);
    if (invalid) {
      return reply.code(400).send({ error: invalid });
    }

    const service = await prisma.service.create({
      data: {
        ...fields,
        salonId,
        // An empty list means "everyone", which is also the default.
        ...(staffIds && staffIds.length > 0
          ? { staff: { connect: staffIds.map((id) => ({ id })) } }
          : {}),
      },
      include: SERVICE_INCLUDE,
    });
    return reply.code(201).send(service);
  });

  app.patch<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const parsed = updateServiceSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const salonId = request.salon!.id;
    const { staffIds, ...fields } = parsed.data;

    const invalid = await invalidRelation(salonId, fields.categoryId, staffIds);
    if (invalid) {
      return reply.code(400).send({ error: invalid });
    }

    // `updateMany` cannot touch a relation, so ownership is checked first and the
    // write goes through `update` — the id is already known to belong to the salon.
    const owned = await prisma.service.findFirst({
      where: { id: request.params.id, salonId },
      select: { id: true },
    });
    if (!owned) {
      return reply.code(404).send({ error: "Service not found" });
    }

    return prisma.service.update({
      where: { id: owned.id },
      data: {
        ...fields,
        // `set` replaces the whole assignment; an empty array reopens it to everyone.
        ...(staffIds ? { staff: { set: staffIds.map((id) => ({ id })) } } : {}),
      },
      include: SERVICE_INCLUDE,
    });
  });

  // Soft delete (keeps appointment history).
  app.delete<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const updated = await prisma.service.updateMany({
      where: { id: request.params.id, salonId: request.salon!.id },
      data: { active: false },
    });
    if (updated.count === 0) {
      return reply.code(404).send({ error: "Service not found" });
    }

    return { ok: true };
  });
}
