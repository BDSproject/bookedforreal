import { z } from "zod";

/** Registration payload: creates a User (OWNER) and their Salon. */
export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  salonName: z.string().min(1).max(120),
});

/** Login payload. */
export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
