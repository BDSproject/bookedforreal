import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { createBookingSchema } from "@bookedforreal/types";

/** Public fields exposed for a salon listing; never leaks internal data. */
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
} as const;

interface SalonParams {
  slug: string;
}

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

  // POST /salons/:slug/bookings — create a booking in the tenant namespace.
  app.post<{ Params: SalonParams }>("/:slug/bookings", async (request, reply) => {
    const parsed = createBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid booking payload", details: parsed.error.issues });
    }

    const salon = await prisma.salon.findUnique({ where: { slug: request.params.slug } });
    if (!salon) {
      return reply.code(404).send({ error: "Salon not found" });
    }

    const service = await prisma.service.findFirst({
      where: { id: parsed.data.serviceId, salonId: salon.id, isActive: true },
    });
    if (!service) {
      return reply.code(400).send({ error: "Service not available for this salon" });
    }

    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

    const booking = await prisma.booking.create({
      data: {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: parsed.data.stylistId,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone,
        startsAt,
        endsAt,
        notes: parsed.data.notes,
      },
    });

    return reply.code(201).send(booking);
  });
}
