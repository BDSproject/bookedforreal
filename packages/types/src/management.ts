import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

/** Fields an owner can update on their salon. */
export const updateSalonSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(2).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(254).optional(),
  logoUrl: z.string().url().max(500).optional(),
  primaryColor: z.string().max(7).optional(),
  timezone: z.string().max(64).optional(),
});

export const createStaffSchema = z.object({
  name: z.string().min(1).max(120),
  photoUrl: z.string().url().max(500).optional(),
  active: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});
export const updateStaffSchema = createStaffSchema.partial();

export const createServiceSchema = z.object({
  nameFr: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative().optional(),
  bufferMin: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});
export const updateServiceSchema = createServiceSchema.partial();

export const createAvailabilitySchema = z.object({
  staffId: z.string().min(1),
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  breakStart: z.string().regex(timeRegex).optional(),
  breakEnd: z.string().regex(timeRegex).optional(),
});
export const updateAvailabilitySchema = createAvailabilitySchema.partial();

export type UpdateSalonInput = z.infer<typeof updateSalonSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
