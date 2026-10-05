import { z } from "zod";

/** Customer identity used to find or create a Client within a salon. */
export const createClientSchema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(254).optional(),
  locale: z.string().max(5).optional(),
  consentRgpd: z.boolean().default(false),
});

/** Validated payload for creating an appointment on behalf of a customer. */
export const createAppointmentSchema = z.object({
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  client: createClientSchema,
  startAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  source: z.enum(["WEB", "MOBILE", "MANUAL"]).default("WEB"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
