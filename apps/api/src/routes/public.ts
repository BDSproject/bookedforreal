import type { FastifyInstance } from "fastify";

import { AppointmentStatus, prisma } from "@bookedforreal/db";
import {
  availabilityQuerySchema,
  availabilityRangeSchema,
  createAppointmentSchema,
  listSalonsQuerySchema,
} from "@bookedforreal/types";
import { addDays, format, parseISO } from "date-fns";

import { createAppointment } from "../services/appointments";
import { isQuotaExceeded, reportBookingUsage } from "../services/billing";
import { scheduleAppointmentNotifications } from "../services/notifications";
import { dayRangeUtc, generateSlots, weekdayOfDate, type Slot } from "../services/slots";
import { hasAccess } from "../lib/trial";

/** Public fields exposed for a salon; never leaks ownerId/Stripe/trial data. */
const publicSalonSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  address: true,
  city: true,
  postalCode: true,
  country: true,
  phone: true,
  email: true,
  logoUrl: true,
  primaryColor: true,
  timezone: true,
  services: {
    where: { active: true },
    select: {
      id: true,
      nameFr: true,
      nameEn: true,
      durationMin: true,
      priceCents: true,
      bufferMin: true,
      category: { select: { id: true, name: true, order: true } },
      staff: { select: { id: true } },
    },
  },
  staff: { where: { active: true }, select: { id: true, name: true, photoUrl: true, order: true } },
  availabilities: {
    select: {
      id: true,
      staffId: true,
      weekday: true,
      startTime: true,
      endTime: true,
      breakStart: true,
      breakEnd: true,
    },
  },
} as const;

/** Loads the salon, the service and the staff who can perform it. */
async function availabilityContext(
  slug: string,
  serviceId: string,
  staffId: string | undefined,
): Promise<
  | { error: string; status: number }
  | {
      salon: { id: string; timezone: string };
      service: { durationMin: number; bufferMin: number };
      staffList: { id: string }[];
    }
> {
  const salon = await prisma.salon.findUnique({ where: { slug } });
  if (!salon) {
    return { error: "Salon not found", status: 404 };
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, salonId: salon.id, active: true },
    include: { staff: { select: { id: true } } },
  });
  if (!service) {
    return { error: "Service not available", status: 400 };
  }

  // A service assigned to nobody is open to the whole team.
  const assigned = service.staff.map((member) => member.id);
  const canPerform = (id: string) => assigned.length === 0 || assigned.includes(id);

  const staffList = (
    staffId
      ? await prisma.staff.findMany({
          where: { id: staffId, salonId: salon.id, active: true },
        })
      : await prisma.staff.findMany({ where: { salonId: salon.id, active: true } })
  ).filter((member) => canPerform(member.id));

  return {
    salon: { id: salon.id, timezone: salon.timezone },
    service: { durationMin: service.durationMin, bufferMin: service.bufferMin },
    staffList,
  };
}

/** Free slots for one service on one calendar day, keyed by staff id. */
async function slotsForDate(
  salon: { id: string; timezone: string },
  service: { durationMin: number; bufferMin: number },
  staffList: { id: string }[],
  date: string,
): Promise<Record<string, Slot[]>> {
  const { start: dayStart, end: dayEnd } = dayRangeUtc(date, salon.timezone);
  const weekday = weekdayOfDate(date);
  const result: Record<string, Slot[]> = {};

  for (const staff of staffList) {
    const [availabilities, appointments, blocks] = await Promise.all([
      prisma.availability.findMany({ where: { salonId: salon.id, staffId: staff.id, weekday } }),
      prisma.appointment.findMany({
        where: {
          salonId: salon.id,
          staffId: staff.id,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
          startAt: { gte: dayStart, lt: dayEnd },
        },
        include: { service: { select: { bufferMin: true } } },
      }),
      // Manually blocked slots act like occupied time with no buffer.
      prisma.timeBlock.findMany({
        where: {
          salonId: salon.id,
          staffId: staff.id,
          startAt: { lt: dayEnd },
          endAt: { gt: dayStart },
        },
      }),
    ]);

    const occupied = [
      ...appointments.map((a) => ({
        startAt: a.startAt,
        endAt: a.endAt,
        bufferMin: a.service.bufferMin,
      })),
      ...blocks.map((block) => ({
        startAt: block.startAt,
        endAt: block.endAt,
        bufferMin: 0,
      })),
    ];

    const slots: Slot[] = [];
    for (const avail of availabilities) {
      slots.push(
        ...generateSlots({
          date,
          timezone: salon.timezone,
          startTime: avail.startTime,
          endTime: avail.endTime,
          breakStart: avail.breakStart,
          breakEnd: avail.breakEnd,
          durationMin: service.durationMin,
          bufferMin: service.bufferMin,
          occupied,
        }),
      );
    }

    result[staff.id] = slots;
  }

  return result;
}

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  // GET /public/salons — list/search salons (optional city + type filter).
  app.get("/salons", async (request, reply) => {
    const query = listSalonsQuerySchema.safeParse(request.query);

    if (!query.success) {
      return reply.code(400).send({ error: "Invalid query", details: query.error.issues });
    }

    const salons = await prisma.salon.findMany({
      where: {
        ...(query.data.city ? { city: { equals: query.data.city, mode: "insensitive" } } : {}),
        ...(query.data.type ? { type: query.data.type } : {}),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        city: true,
        district: true,
        description: true,
        logoUrl: true,
        primaryColor: true,
      },
      orderBy: { name: "asc" },
    });

    return salons;
  });

  // GET /public/salons/:slug — salon info + services + staff + weekly hours.
  app.get<{ Params: { slug: string } }>("/salons/:slug", async (request, reply) => {
    const salon = await prisma.salon.findUnique({
      where: { slug: request.params.slug },
      select: {
        ...publicSalonSelect,
        trialEndsAt: true,
        subscription: { select: { status: true } },
      },
    });

    if (!salon) {
      return reply.code(404).send({ error: "Salon not found" });
    }

    // The trial/subscription data itself is never exposed — only the resulting
    // `bookingEnabled` flag, which the mini-site uses to close the booking flow.
    const { trialEndsAt, subscription, ...publicSalon } = salon;
    return {
      ...publicSalon,
      bookingEnabled: hasAccess({
        trialEndsAt,
        subscriptionStatus: subscription?.status ?? null,
      }),
    };
  });

  // GET /public/salons/:slug/availability — free slots for a date (+ optional staff).
  app.get<{ Params: { slug: string } }>("/salons/:slug/availability", async (request, reply) => {
    const query = availabilityQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Invalid query", details: query.error.issues });
    }
    if (!query.data.serviceId) {
      return reply.code(400).send({ error: "serviceId is required" });
    }

    const context = await availabilityContext(
      request.params.slug,
      query.data.serviceId,
      query.data.staffId,
    );
    if ("error" in context) {
      return reply.code(context.status).send({ error: context.error });
    }
    const { salon, service, staffList } = context;

    const slots = await slotsForDate(salon, service, staffList, query.data.date);
    return { date: query.data.date, timezone: salon.timezone, slots };
  });

  // GET /public/salons/:slug/availability/range — a week of slots in one call.
  app.get<{ Params: { slug: string } }>(
    "/salons/:slug/availability/range",
    async (request, reply) => {
      const query = availabilityRangeSchema.safeParse(request.query);
      if (!query.success) {
        return reply.code(400).send({ error: "Invalid query", details: query.error.issues });
      }

      const context = await availabilityContext(
        request.params.slug,
        query.data.serviceId,
        query.data.staffId,
      );
      if ("error" in context) {
        return reply.code(context.status).send({ error: context.error });
      }
      const { salon, service, staffList } = context;

      const slots: Record<string, Record<string, Slot[]>> = {};
      const start = parseISO(query.data.from);
      for (let index = 0; index < query.data.days; index += 1) {
        const date = format(addDays(start, index), "yyyy-MM-dd");
        slots[date] = await slotsForDate(salon, service, staffList, date);
      }

      return {
        from: query.data.from,
        days: query.data.days,
        timezone: salon.timezone,
        slots,
      };
    },
  );

  // POST /public/salons/:slug/appointments — create an appointment.
  app.post<{ Params: { slug: string } }>("/salons/:slug/appointments", async (request, reply) => {
    const parsed = createAppointmentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const salon = await prisma.salon.findUnique({
      where: { slug: request.params.slug },
      include: { subscription: { select: { status: true } } },
    });
    if (!salon) {
      return reply.code(404).send({ error: "Salon not found" });
    }

    // Trial over and no subscription: the salon's booking flow is closed.
    if (
      !hasAccess({
        trialEndsAt: salon.trialEndsAt,
        subscriptionStatus: salon.subscription?.status ?? null,
      })
    ) {
      return reply.code(403).send({ error: "BOOKING_UNAVAILABLE" });
    }

    if (await isQuotaExceeded(salon.id)) {
      return reply.code(403).send({ error: "Quota exceeded — upgrade your plan" });
    }

    const service = await prisma.service.findFirst({
      where: { id: parsed.data.serviceId, salonId: salon.id, active: true },
    });
    if (!service) {
      return reply.code(400).send({ error: "Service not available" });
    }

    const staff = await prisma.staff.findFirst({
      where: { id: parsed.data.staffId, salonId: salon.id, active: true },
    });
    if (!staff) {
      return reply.code(400).send({ error: "Staff not available" });
    }

    // The slot list already hides them, but the API must not trust the client.
    const assignees = await prisma.service.findUnique({
      where: { id: service.id },
      select: { staff: { select: { id: true } } },
    });
    const assigned = assignees?.staff.map((member) => member.id) ?? [];
    if (assigned.length > 0 && !assigned.includes(staff.id)) {
      return reply.code(400).send({ error: "Staff cannot perform this service" });
    }

    const client = await findOrCreateClient(
      salon.id,
      parsed.data.name,
      parsed.data.phone,
      parsed.data.email,
    );

    const appointment = await createAppointment({
      salonId: salon.id,
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

    // Pay-as-you-go metering: fire-and-forget so Stripe never blocks a booking.
    void reportBookingUsage(salon.id);

    // Client confirmation, J-1 reminder and salon alert over WhatsApp, then SMS.
    void scheduleAppointmentNotifications(appointment.id);

    return reply.code(201).send(appointment);
  });

  // GET /public/salons/:slug/appointments/:id — appointment status.
  app.get<{ Params: { slug: string; id: string } }>(
    "/salons/:slug/appointments/:id",
    async (request, reply) => {
      const appointment = await prisma.appointment.findFirst({
        where: { id: request.params.id, salon: { slug: request.params.slug } },
        select: { id: true, status: true, startAt: true, endAt: true },
      });

      if (!appointment) {
        return reply.code(404).send({ error: "Appointment not found" });
      }

      return appointment;
    },
  );
}

/** Finds a client by email (then phone) within the salon, or creates a new one. */
async function findOrCreateClient(
  salonId: string,
  name: string,
  phone: string | undefined,
  email: string | undefined,
): Promise<{ id: string }> {
  if (email) {
    const existing = await prisma.client.findFirst({ where: { salonId, email } });
    if (existing) {
      return existing;
    }
  } else if (phone) {
    const existing = await prisma.client.findFirst({ where: { salonId, phone } });
    if (existing) {
      return existing;
    }
  }

  return prisma.client.create({
    data: { salonId, name, phone: phone ?? null, email: email ?? null, consentRgpd: true },
  });
}
