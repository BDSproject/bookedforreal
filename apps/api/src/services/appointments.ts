import { AppointmentStatus, prisma, type AppointmentSource } from "@bookedforreal/db";

export interface CreateAppointmentParams {
  salonId: string;
  staffId: string;
  serviceId: string;
  clientId: string;
  startAt: Date;
  durationMin: number;
  source: AppointmentSource;
  notes?: string | null;
}

/**
 * Creates an appointment atomically, returning `null` when the slot is already
 * taken (an overlapping PENDING/CONFIRMED appointment exists for the staff).
 * The interactive transaction prevents double booking.
 */
export async function createAppointment(params: CreateAppointmentParams) {
  const endAt = new Date(params.startAt.getTime() + params.durationMin * 60_000);

  return prisma.$transaction(async (tx) => {
    const conflict = await tx.appointment.findFirst({
      where: {
        salonId: params.salonId,
        staffId: params.staffId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        startAt: { lt: endAt },
        endAt: { gt: params.startAt },
      },
    });

    if (conflict) {
      return null;
    }

    return tx.appointment.create({
      data: {
        salonId: params.salonId,
        staffId: params.staffId,
        serviceId: params.serviceId,
        clientId: params.clientId,
        startAt: params.startAt,
        endAt,
        source: params.source,
        notes: params.notes,
      },
    });
  });
}
