import type { FastifyInstance } from "fastify";

import { formatInTimeZone } from "date-fns-tz";

import { AppointmentStatus, prisma } from "@bookedforreal/db";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { requireActiveSubscription } from "../middleware/subscription";
import { dayRangeUtc } from "../services/slots";

export async function statsRoutes(app: FastifyInstance): Promise<void> {
  // GET /stats/dashboard — key figures for the dashboard.
  app.get(
    "/dashboard",
    { preHandler: [requireAuth, requireSalon, requireActiveSubscription] },
    async (request) => {
      const salonId = request.salon!.id;
      const salon = await prisma.salon.findUniqueOrThrow({ where: { id: salonId } });

      const today = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM-dd");
      const { start, end } = dayRangeUtc(today, salon.timezone);

      const [appointmentsToday, upcoming, clients, services, staff] = await Promise.all([
        prisma.appointment.count({ where: { salonId, startAt: { gte: start, lt: end } } }),
        prisma.appointment.count({
          where: {
            salonId,
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
            startAt: { gte: new Date() },
          },
        }),
        prisma.client.count({ where: { salonId } }),
        prisma.service.count({ where: { salonId, active: true } }),
        prisma.staff.count({ where: { salonId, active: true } }),
      ]);

      return {
        today,
        appointmentsToday,
        upcoming,
        clients,
        services,
        staff,
      };
    },
  );
}
