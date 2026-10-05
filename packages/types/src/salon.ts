import { z } from "zod";

/** URL path parameter used to resolve a tenant by its slug. */
export const salonSlugSchema = z.object({
  slug: z.string().min(1).max(100),
});

export type SalonSlug = z.infer<typeof salonSlugSchema>;
