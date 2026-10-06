import { prisma } from "@bookedforreal/db";

import type { Channel } from "../lib/notifications/providers";
import { sendWithFallback } from "../lib/notifications/providers";
import { PLANS } from "../lib/plans";

export interface NotificationPayload {
  salonId: string;
  appointmentId?: string;
  to: string;
  message: string;
  channels: Channel[];
}

/** Restricts channels to the plan quota (USAGE and SOLO are email only). */
export async function allowedChannels(salonId: string, requested: Channel[]): Promise<Channel[]> {
  const salon = await prisma.salon.findUnique({ where: { id: salonId }, select: { plan: true } });
  if (!salon) return [];
  const credits = PLANS[salon.plan].smsWhatsAppCredits;
  if (credits === 0) {
    return requested.includes("EMAIL") ? ["EMAIL"] : [];
  }
  return requested;
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
      const channel = await sendWithFallback(payload.to, payload.message, payload.channels);

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
