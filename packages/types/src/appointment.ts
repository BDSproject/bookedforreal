import { z } from "zod";

export const APPOINTMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "DONE",
  "NO_SHOW",
] as const;
export const APPOINTMENT_SOURCES = ["WEB", "MOBILE", "MANUAL"] as const;

/** Public appointment creation: the client is found or created from name/phone/email. */
export const createAppointmentSchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  name: z.string().min(1).max(120),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(254).optional(),
  startAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  source: z.enum(APPOINTMENT_SOURCES).default("WEB"),
});

/** Manual (back-office) appointment creation against an existing client. */
export const createManualAppointmentSchema = z.object({
  clientId: z.string().min(1),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  startAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  source: z.enum(APPOINTMENT_SOURCES).default("MANUAL"),
});

/** Status transition for an appointment (confirm, cancel, complete, no-show). */
export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
});

/** Query filters for listing appointments. */
export const listAppointmentsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
});

/** Period for the per-staff statistics, as `YYYY-MM-DD` calendar days. */
export const staffStatsQuerySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/** Availability query params (date + optional service/staff filters). */
export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().min(1).optional(),
  staffId: z.string().min(1).optional(),
});

/** Multi-day availability: free slots for a service over a few days. */
export const availabilityRangeSchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1).optional(),
  /** First day of the window, `YYYY-MM-DD`. */
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Number of days to return, capped at 14. */
  days: z.coerce.number().int().min(1).max(14).default(7),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateManualAppointmentInput = z.infer<typeof createManualAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type AvailabilityRangeQuery = z.infer<typeof availabilityRangeSchema>;
export type StaffStatsQuery = z.infer<typeof staffStatsQuerySchema>;
