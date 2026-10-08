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

/** A section of the price list ("Coupes", "Colorations"…). */
export const createServiceCategorySchema = z.object({
  name: z.string().min(1).max(60),
  /** Display order inside the price list. */
  order: z.number().int().nonnegative().optional(),
});
export const updateServiceCategorySchema = createServiceCategorySchema.partial();

export const createServiceSchema = z.object({
  nameFr: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative().optional(),
  bufferMin: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
  /** Price-list section; `null` moves the service back to the ungrouped list. */
  categoryId: z.string().min(1).nullable().optional(),
  /**
   * Staff who can perform it. An empty array means everyone, which is also the
   * behaviour of every service created before this field existed.
   */
  staffIds: z.array(z.string().min(1)).optional(),
});
export const updateServiceSchema = createServiceSchema.partial();

/**
 * A recurring weekly opening window. `breakStart`/`breakEnd` accept `null` so a
 * salon can remove a lunch break it had saved before.
 */
const availabilityFields = z.object({
  staffId: z.string().min(1),
  /** 0 = Sunday … 6 = Saturday. */
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  breakStart: z.string().regex(timeRegex).nullable().optional(),
  breakEnd: z.string().regex(timeRegex).nullable().optional(),
});

export const createAvailabilitySchema = availabilityFields.refine(
  (value) => value.startTime < value.endTime,
  { message: "endTime must be after startTime", path: ["endTime"] },
);
export const updateAvailabilitySchema = availabilityFields.partial();

/** A manually blocked slot on the calendar (holiday, personal appointment…). */
const timeBlockFields = z.object({
  staffId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  label: z.string().max(120).nullable().optional(),
});

export const createTimeBlockSchema = timeBlockFields.refine(
  (value) => new Date(value.startAt) < new Date(value.endAt),
  { message: "endAt must be after startAt", path: ["endAt"] },
);
export const updateTimeBlockSchema = timeBlockFields.partial();

export type UpdateSalonInput = z.infer<typeof updateSalonSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;
export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>;
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CreateTimeBlockInput = z.infer<typeof createTimeBlockSchema>;
export type UpdateTimeBlockInput = z.infer<typeof updateTimeBlockSchema>;
