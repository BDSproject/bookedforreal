import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { createTimeBlockSchema, updateTimeBlockSchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { requireActiveSubscription } from "../middleware/subscription";

/** Query filters for listing time blocks. */
function parseRange(query: Record<string, unknown>): { from?: Date; to?: Date } | null {
  const range: { from?: Date; to?: Date } = {};
  if (typeof query.from === "string" && query.from) {
    const from = new Date(query.from);
    if (Number.isNaN(from.getTime())) return null;
    range.from = from;
  }
  if (typeof query.to === "string" && query.to) {
    const to = new Date(query.to);
    if (Number.isNaN(to.getTime())) return null;
    range.to = to;
  }
  return range;
}

/**
 * Blocked calendar slots (prefix /time-blocks).
 * A blocked slot removes the corresponding time from the public availability,
 * so clients cannot book over a holiday or a personal appointment.
 */
export async function timeBlockRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon, requireActiveSubscription] };

  app.get("/", guard, async (request, reply) => {
    const range = parseRange(request.query as Record<string, unknown>);
    if (!range) {
      return reply.code(400).send({ error: "Invalid query" });
    }

    const startAt: { gte?: Date; lte?: Date } = {};
    if (range.from) startAt.gte = range.from;
    if (range.to) startAt.lte = range.to;

    return prisma.timeBlock.findMany({
      where: { salonId: request.salon!.id, ...(startAt.gte || startAt.lte ? { startAt } : {}) },
      orderBy: { startAt: "asc" },
      include: { staff: { select: { id: true, name: true } } },
    });
  });

  app.post("/", guard, async (request, reply) => {
    const parsed = createTimeBlockSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const salonId = request.salon!.id;
    const staff = await prisma.staff.findFirst({
      where: { id: parsed.data.staffId, salonId, active: true },
      select: { id: true },
    });
    if (!staff) {
      return reply.code(400).send({ error: "Staff not available" });
    }

    const block = await prisma.timeBlock.create({
      data: { ...parsed.data, salonId },
      include: { staff: { select: { id: true, name: true } } },
    });
    return reply.code(201).send(block);
  });

  app.patch<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const parsed = updateTimeBlockSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const updated = await prisma.timeBlock.updateMany({
      where: { id: request.params.id, salonId: request.salon!.id },
      data: parsed.data,
    });
    if (updated.count === 0) {
      return reply.code(404).send({ error: "Time block not found" });
    }

    return prisma.timeBlock.findUnique({
      where: { id: request.params.id },
      include: { staff: { select: { id: true, name: true } } },
    });
  });

  app.delete<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const deleted = await prisma.timeBlock.deleteMany({
      where: { id: request.params.id, salonId: request.salon!.id },
    });
    if (deleted.count === 0) {
      return reply.code(404).send({ error: "Time block not found" });
    }
    return { ok: true };
  });
}
