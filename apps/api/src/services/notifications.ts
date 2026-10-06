import { prisma } from "@bookedforreal/db";

import {
  buildMessage,
  buildWhatsappTemplate,
  formatAppointmentWhen,
  type AppointmentMessageKind,
  type AppointmentMessageVars,
} from "../lib/notifications/messages";
import type { Channel } from "../lib/notifications/providers";
import { sendWithFallback } from "../lib/notifications/providers";
import { normalizePhone } from "../lib/phone";
import { PLANS } from "../lib/plans";

/**
 * Channel order for every appointment message, cheapest first.
 * In France a WhatsApp utility message costs roughly 0,03–0,05 € against 0,08 €
 * for a single-segment SMS, and WhatsApp is free for the recipient.
 */
export const CHANNEL_CHAIN: Channel[] = ["WHATSAPP", "SMS"];

/** How long before the appointment the reminder goes out. */
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

export interface NotificationPayload {
  salonId: string;
  appointmentId?: string;
  /** Recipient in E.164 (`+33612345678`). */
  to: string;
  /** Which message to render. */
  kind: AppointmentMessageKind;
  /** Values injected into the message. */
  vars: AppointmentMessageVars;
  /** Recipient language (`fr` or `en`). */
  locale: string;
  channels: Channel[];
}

/** WhatsApp/SMS messages still available to a salon this month. */
export async function remainingCredits(salonId: string): Promise<number> {
  const salon = await prisma.salon.findUnique({ where: { id: salonId }, select: { plan: true } });
  if (!salon) {
    return 0;
  }

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const used = await prisma.notification.count({
    where: { appointment: { salonId }, sentAt: { gte: startOfMonth } },
  });

  return Math.max(0, PLANS[salon.plan].smsWhatsAppCredits - used);
}

/**
 * Narrows the requested channels to what the salon may actually use.
 * Returns an empty list once the monthly credit quota is exhausted, which makes
 * the caller drop the notification instead of overspending on the plan.
 */
export async function allowedChannels(salonId: string, requested: Channel[]): Promise<Channel[]> {
  const allowed = CHANNEL_CHAIN.filter((channel) => requested.includes(channel));
  if (allowed.length === 0) {
    return [];
  }
  return (await remainingCredits(salonId)) > 0 ? allowed : [];
}

/** Enqueues a notification job for the worker. */
export async function enqueueNotification(params: {
  type: string;
  runAt: Date;
  payload: NotificationPayload;
}) {
  const channels = await allowedChannels(params.payload.salonId, params.payload.channels);
  if (channels.length === 0) {
    return null;
  }
  return prisma.job.create({
    data: {
      type: params.type,
      runAt: params.runAt,
      payload: { ...params.payload, channels } as unknown as object,
    },
  });
}

/**
 * Queues the three messages that follow a new appointment:
 * the client confirmation, the J-1 reminder and the salon alert.
 *
 * Fire-and-forget: a messaging problem must never make a booking fail.
 */
export async function scheduleAppointmentNotifications(appointmentId: string): Promise<void> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        salon: { include: { owner: { select: { locale: true } } } },
        service: { select: { nameFr: true, nameEn: true } },
        client: { select: { name: true, phone: true, locale: true } },
      },
    });
    if (!appointment) {
      return;
    }

    const { salon, service, client } = appointment;
    const when = formatAppointmentWhen(appointment.startAt, salon.timezone, client.locale);
    const vars: AppointmentMessageVars = {
      salonName: salon.name,
      service: client.locale === "en" ? service.nameEn : service.nameFr,
      clientName: client.name,
      date: when.date,
      time: when.time,
    };

    const queue: Promise<unknown>[] = [];
    const enqueue = (kind: AppointmentMessageKind, runAt: Date, to: string, locale: string) =>
      enqueueNotification({
        type: `appointment.${kind.toLowerCase()}`,
        runAt,
        payload: {
          salonId: salon.id,
          appointmentId: appointment.id,
          to,
          kind,
          vars,
          locale,
          channels: CHANNEL_CHAIN,
        },
      });

    // The client only hears from us when we hold a number we can actually dial.
    const clientPhone = normalizePhone(client.phone);
    if (clientPhone) {
      queue.push(enqueue("CONFIRMATION", new Date(), clientPhone, client.locale));

      // Nothing to remind when the appointment is already less than a day away.
      const reminderAt = new Date(appointment.startAt.getTime() - REMINDER_LEAD_MS);
      if (reminderAt.getTime() > Date.now()) {
        queue.push(enqueue("REMINDER", reminderAt, clientPhone, client.locale));
      }
    }

    // The salon is alerted on its own number, in the owner's language.
    const salonPhone = normalizePhone(salon.phone);
    if (salonPhone) {
      queue.push(enqueue("OWNER_ALERT", new Date(), salonPhone, salon.owner.locale));
    }

    await Promise.all(queue);
  } catch (error) {
    console.error("Failed to schedule appointment notifications", error);
  }
}

/** Processes due jobs (run by the cron worker every minute). Returns the count handled. */
export async function processDueJobs(): Promise<number> {
  const jobs = await prisma.job.findMany({
    where: { status: "PENDING", runAt: { lte: new Date() } },
    orderBy: { runAt: "asc" },
    take: 50,
  });

  for (const job of jobs) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "PROCESSING", attempts: { increment: 1 } },
    });

    try {
      const payload = job.payload as unknown as NotificationPayload;

      // A reminder queued before a cancellation must not go out.
      if (payload.appointmentId) {
        const appointment = await prisma.appointment.findUnique({
          where: { id: payload.appointmentId },
          select: { status: true },
        });
        if (!appointment || appointment.status === "CANCELLED") {
          await prisma.job.update({
            where: { id: job.id },
            data: { status: "DONE", error: "Skipped: appointment cancelled" },
          });
          continue;
        }
      }

      // The body and the WhatsApp template are resolved at send time, so a
      // template approved after the job was queued is picked up automatically.
      const channel = await sendWithFallback({
        to: payload.to,
        message: buildMessage(payload.kind, payload.locale, payload.vars),
        whatsapp: buildWhatsappTemplate(payload.kind, payload.vars),
        channels: payload.channels,
      });

      if (payload.appointmentId) {
        await prisma.notification.create({
          data: {
            appointmentId: payload.appointmentId,
            channel,
            status: "SENT",
            sentAt: new Date(),
          },
        });
      }

      await prisma.job.update({ where: { id: job.id }, data: { status: "DONE" } });
    } catch (error) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "FAILED", error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  return jobs.length;
}
