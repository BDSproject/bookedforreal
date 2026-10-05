import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";

export async function clientRoutes(app: FastifyInstance): Promise<void> {
  // GET /clients — list clients (tenant-scoped), most recent first.
  app.get("/", { preHandler: [requireAuth, requireSalon] }, async (request) => {
    return prisma.client.findMany({
      where: { salonId: request.salon!.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { appointments: true } } },
    });
  });
}
