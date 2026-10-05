import { z } from "zod";

/**
 * Validated payload for creating a booking on behalf of a customer.
 * `startsAt` is an ISO-8601 datetime; the end time is derived from the service duration.
 */
export const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  stylistId: z.string().min(1).optional(),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email().max(254),
  customerPhone: z.string().max(30).optional(),
  startsAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
