import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import {
  notificationPreferencesSchema,
  notificationQuerySchema,
  notificationTestSchema,
} from "@bookedforreal/types";

import { normalizePhone } from "../lib/phone";
import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { requireActiveSubscription } from "../middleware/subscription";
import { allowedChannels, CHANNEL_CHAIN, enqueueNotification } from "../services/notifications";

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon, requireActiveSubscription] };

  // POST /notifications/test — sends a real WhatsApp/SMS to check the setup.
  app.post("/test", guard, async (request, reply) => {
    const parsed = notificationTestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid payload", details: parsed.error.issues });
    }

    const salon = await prisma.salon.findUnique({
      where: { id: request.salon!.id },
      select: { id: true, name: true, phone: true, owner: { select: { locale: true } } },
    });
    if (!salon) {
      return reply.code(404).send({ error: "Salon not found" });
    }

    const to = normalizePhone(parsed.data.phone ?? salon.phone);
    if (!to) {
      return reply.code(400).send({
        error: "NO_PHONE",
        message: "Renseignez un numéro de téléphone valide sur le salon",
      });
    }

    const channels = await allowedChannels(salon.id, CHANNEL_CHAIN);
    if (channels.length === 0) {
      return reply.code(402).send({
        error: "NO_CREDITS",
        message: "Quota de messages WhatsApp/SMS épuisé pour ce mois",
      });
    }

    const vars = {
      salonName: salon.name,
      service: "",
      clientName: "",
      date: "",
      time: "",
    };

    const job = await enqueueNotification({
      type: "notification.test",
      runAt: new Date(),
      payload: {
        salonId: salon.id,
        to,
        kind: "TEST",
        vars,
        locale: salon.owner.locale,
        channels,
      },
    });

    return reply.code(201).send({ jobId: job?.id ?? null, to, channels });
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
