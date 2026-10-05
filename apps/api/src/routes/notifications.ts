import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { notificationPreferencesSchema, notificationQuerySchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { enqueueNotification } from "../services/notifications";

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon] };

  // POST /notifications/test — enqueues a test email notification.
  app.post("/test", guard, async (request, reply) => {
    const job = await enqueueNotification({
      type: "notification.test",
      runAt: new Date(),
      payload: {
        salonId: request.salon!.id,
        to: request.user!.email,
        message: "Test notification",
        channels: ["EMAIL"],
      },
    });
    return reply.code(201).send({ jobId: job?.id ?? null });
  });

  // GET /notifications?appointmentId= — lists notifications (tenant-scoped).
  app.get("/", guard, async (request, reply) => {
    const query = notificationQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Invalid query" });
    }

    return prisma.notification.findMany({
      where: {
        appointment: { salonId: request.salon!.id },
        ...(query.data.appointmentId ? { appointmentId: query.data.appointmentId } : {}),
      },
      orderBy: { sentAt: "desc" },
    });
  });

  // PATCH /notifications/preferences — updates a client RGPD opt-in.
  app.patch("/preferences", guard, async (request, reply) => {
    const parsed = notificationPreferencesSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid payload", details: parsed.error.issues });
    }

    const updated = await prisma.client.updateMany({
      where: { id: parsed.data.clientId, salonId: request.salon!.id },
      data: { consentRgpd: parsed.data.consentRgpd },
    });
    if (updated.count === 0) {
      return reply.code(404).send({ error: "Client not found" });
    }

    return { ok: true };
  });
}
