import { z } from "zod";

/** Client account creation (email + password, after a booking or standalone). */
export const clientRegisterSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
});

/** Client sign-in with a password. */
export const clientLoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

/** "Sign in with Google" — the `credential` is a Google ID token (JWT). */
export const clientGoogleSchema = z.object({
  credential: z.string().min(1),
});

/** Token from the verification email, used to confirm the inbox is real. */
export const clientVerifySchema = z.object({
  token: z.string().min(1),
});

export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type ClientLoginInput = z.infer<typeof clientLoginSchema>;
export type ClientGoogleInput = z.infer<typeof clientGoogleSchema>;
export type ClientVerifyInput = z.infer<typeof clientVerifySchema>;
