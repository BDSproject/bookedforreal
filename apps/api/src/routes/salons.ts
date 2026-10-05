import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { createAppointmentSchema, type CreateClientInput } from "@bookedforreal/types";

/** Public fields exposed for a salon profile; never leaks internal data. */
const publicSalonSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  address: true,
  city: true,
  postalCode: true,
  country: true,
  timezone: true,
  logoUrl: true,
  primaryColor: true,
} as const;

interface SalonParams {
  slug: string;
}

/**
 * Tenant-scoped routes. Every query against a tenant model MUST filter by
 * `salonId` (resolved from the `:slug` param) to enforce multi-tenant isolation.
 */
export async function salonRoutes(app: FastifyInstance): Promise<void> {
  // GET /salons/:slug — public salon profile (tenant lookup by slug).
  app.get<{ Params: SalonParams }>("/:slug", async (request, reply) => {
    const salon = await prisma.salon.findUnique({
      where: { slug: request.params.slug },
      select: publicSalonSelect,
    });

    if (!salon) {
      return reply.code(404).send({ error: "Salon not found" });
    }

    return salon;
  });

  // POST /salons/:slug/appointments — create an appointment (finds/creates the client).
  app.post<{ Params: SalonParams }>("/:slug/appointments", async (request, reply) => {
    const parsed = createAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid appointment payload", details: parsed.error.issues });
    }

    const salon = await prisma.salon.findUnique({ where: { slug: request.params.slug } });
    if (!salon) {
      return reply.code(404).send({ error: "Salon not found" });
    }

    const service = await prisma.service.findFirst({
      where: { id: parsed.data.serviceId, salonId: salon.id, active: true },
    });
    if (!service) {
      return reply.code(400).send({ error: "Service not available for this salon" });
    }

    const staff = await prisma.staff.findFirst({
      where: { id: parsed.data.staffId, salonId: salon.id, active: true },
    });
    if (!staff) {
      return reply.code(400).send({ error: "Staff not available for this salon" });
    }

    const client = await findOrCreateClient(salon.id, parsed.data.client);

    const startAt = new Date(parsed.data.startAt);
    const endAt = new Date(startAt.getTime() + (service.durationMin + service.bufferMin) * 60_000);

    const appointment = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        staffId: staff.id,
        serviceId: service.id,
        clientId: client.id,
        startAt,
        endAt,
        source: parsed.data.source,
        notes: parsed.data.notes,
      },
    });

    return reply.code(201).send(appointment);
  });
}

/** Finds a client by email (then phone) within the salon, or creates a new one. */
async function findOrCreateClient(salonId: string, input: CreateClientInput): Promise<{ id: string }> {
  if (input.email) {
    const existing = await prisma.client.findFirst({ where: { salonId, email: input.email } });
    if (existing) {
      return existing;
    }
  } else if (input.phone) {
    const existing = await prisma.client.findFirst({ where: { salonId, phone: input.phone } });
    if (existing) {
      return existing;
    }
  }

  return prisma.client.create({
    data: {
      salonId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      locale: input.locale,
      consentRgpd: input.consentRgpd,
    },
  });
}
