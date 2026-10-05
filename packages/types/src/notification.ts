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

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
