import { z } from "zod";

/** Query filters for listing notifications. */
export const notificationQuerySchema = z.object({
  appointmentId: z.string().min(1).optional(),
});

/** Client notification preferences (RGPD opt-in). */
export const notificationPreferencesSchema = z.object({
  clientId: z.string().min(1),
  consentRgpd: z.boolean(),
});

/** Body of the "send me a test message" endpoint; defaults to the salon number. */
export const notificationTestSchema = z.object({
  phone: z.string().max(30).optional(),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type NotificationTestInput = z.infer<typeof notificationTestSchema>;
