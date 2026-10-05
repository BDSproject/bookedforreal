import { z } from "zod";

/** URL path parameter used to resolve a tenant by its slug. */
export const salonSlugSchema = z.object({
  slug: z.string().min(1).max(100),
});

export type SalonSlug = z.infer<typeof salonSlugSchema>;

/** Query filters for listing/searching salons. */
export const listSalonsQuerySchema = z.object({
  city: z.string().max(100).optional(),
  type: z.enum(["HAIR_SALON", "BARBER_SHOP"]).optional(),
});

export type ListSalonsQuery = z.infer<typeof listSalonsQuerySchema>;
