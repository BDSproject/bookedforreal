import type { FastifyInstance } from "fastify";

import { formatInTimeZone } from "date-fns-tz";

import { AppointmentStatus, prisma } from "@bookedforreal/db";
import { staffStatsQuerySchema } from "@bookedforreal/types";

import { requireAuth } from "../middleware/auth";
import { requireSalon } from "../middleware/salon";
import { requireActiveSubscription } from "../middleware/subscription";
import { dayRangeUtc } from "../services/slots";

/** One row of the per-hairdresser report. */
interface StaffStats {
  staffId: string;
  name: string;
  /** Appointments in the period, cancellations excluded. */
  bookings: number;
  completed: number;
  cancelled: number;
  noShow: number;
  upcoming: number;
  revenueCents: number;
}

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

  // GET /stats/staff — what each hairdresser actually did over a period.
  app.get(
    "/staff",
    { preHandler: [requireAuth, requireSalon, requireActiveSubscription] },
    async (request, reply) => {
      const query = staffStatsQuerySchema.safeParse(request.query);
      if (!query.success) {
        return reply.code(400).send({ error: "Invalid query", details: query.error.issues });
      }

      const salonId = request.salon!.id;
      const salon = await prisma.salon.findUniqueOrThrow({ where: { id: salonId } });

      // Defaults to the current month, in the salon's own timezone.
      const today = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM-dd");
      const from = query.data.from ?? `${today.slice(0, 7)}-01`;
      const to = query.data.to ?? today;

      const start = dayRangeUtc(from, salon.timezone).start;
      const end = dayRangeUtc(to, salon.timezone).end;
      const now = new Date();

      const team = await prisma.staff.findMany({
        where: { salonId, active: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          appointments: {
            where: { startAt: { gte: start, lt: end } },
            select: {
              status: true,
              startAt: true,
              service: { select: { priceCents: true } },
            },
          },
        },
      });

      const rows: StaffStats[] = team.map((member) => {
        const stats: StaffStats = {
          staffId: member.id,
          name: member.name,
          bookings: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0,
          upcoming: 0,
          revenueCents: 0,
        };

        for (const appointment of member.appointments) {
          if (appointment.status === AppointmentStatus.CANCELLED) {
            stats.cancelled += 1;
            continue;
          }

          stats.bookings += 1;

          if (appointment.status === AppointmentStatus.DONE) {
            stats.completed += 1;
            // Only a completed appointment actually brings the money in.
            stats.revenueCents += appointment.service.priceCents;
          }
          if (appointment.status === AppointmentStatus.NO_SHOW) {
            stats.noShow += 1;
          }
          if (
            (appointment.status === AppointmentStatus.PENDING ||
              appointment.status === AppointmentStatus.CONFIRMED) &&
            appointment.startAt >= now
          ) {
            stats.upcoming += 1;
          }
        }

        return stats;
      });

      const totals = rows.reduce(
        (accumulator, row) => ({
          bookings: accumulator.bookings + row.bookings,
          completed: accumulator.completed + row.completed,
          revenueCents: accumulator.revenueCents + row.revenueCents,
        }),
        { bookings: 0, completed: 0, revenueCents: 0 },
      );

      return { from, to, staff: rows, totals };
    },
  );
}
