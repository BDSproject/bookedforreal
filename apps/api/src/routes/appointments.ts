import type { FastifyInstance } from "fastify";

import { prisma, Prisma } from "@bookedforreal/db";
import { createManualAppointmentSchema, listAppointmentsQuerySchema, updateAppointmentStatusSchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { createAppointment } from "../services/appointments";

export async function appointmentRoutes(app: FastifyInstance): Promise<void> {
  const guard = { preHandler: [requireAuth, requireSalon] };

  // GET /appointments?from=&to=&status= — list appointments (tenant-scoped).
  app.get("/", guard, async (request, reply) => {
    const query = listAppointmentsQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Invalid query", details: query.error.issues });
    }

    const startAt: { gte?: Date; lte?: Date } = {};
    if (query.data.from) {
      startAt.gte = new Date(query.data.from);
    }
    if (query.data.to) {
      startAt.lte = new Date(query.data.to);
    }

    const where: Prisma.AppointmentWhereInput = { salonId: request.salon!.id };
    if (startAt.gte || startAt.lte) {
      where.startAt = startAt;
    }
    if (query.data.status) {
      where.status = query.data.status;
    }

    return prisma.appointment.findMany({
      where,
      orderBy: { startAt: "asc" },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        staff: { select: { id: true, name: true } },
        service: { select: { id: true, nameFr: true, nameEn: true, durationMin: true, priceCents: true } },
      },
    });
  });

  // POST /appointments — manual creation (back office).
  app.post("/", guard, async (request, reply) => {
    const parsed = createManualAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const salonId = request.salon!.id;
    const service = await prisma.service.findFirst({ where: { id: parsed.data.serviceId, salonId, active: true } });
    if (!service) {
      return reply.code(400).send({ error: "Service not available" });
    }

    const staff = await prisma.staff.findFirst({ where: { id: parsed.data.staffId, salonId, active: true } });
    if (!staff) {
      return reply.code(400).send({ error: "Staff not available" });
    }

    const client = await prisma.client.findFirst({ where: { id: parsed.data.clientId, salonId } });
    if (!client) {
      return reply.code(400).send({ error: "Client not found" });
    }

    const appointment = await createAppointment({
      salonId,
      staffId: staff.id,
      serviceId: service.id,
      clientId: client.id,
      startAt: new Date(parsed.data.startAt),
      durationMin: service.durationMin,
      source: parsed.data.source,
      notes: parsed.data.notes,
    });

    if (!appointment) {
      return reply.code(409).send({ error: "Slot already taken" });
    }

    return reply.code(201).send(appointment);
  });

  // PATCH /appointments/:id — confirm / cancel / complete / no-show.
  app.patch<{ Params: { id: string } }>("/:id", guard, async (request, reply) => {
    const parsed = updateAppointmentStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const updated = await prisma.appointment.updateMany({
      where: { id: request.params.id, salonId: request.salon!.id },
      data: { status: parsed.data.status },
    });
    if (updated.count === 0) {
      return reply.code(404).send({ error: "Appointment not found" });
    }

    return prisma.appointment.findUnique({
      where: { id: request.params.id },
      include: { client: true, staff: true, service: true },
    });
  });
}
