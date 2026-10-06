import { z } from "zod";

/** Payload for the billing checkout endpoint (GROUP is quoted by sales). */
export const checkoutSchema = z.object({
  plan: z.enum(["USAGE", "SOLO", "SALON"]),
  /** Billing interval — maps to a distinct Stripe price per plan. */
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
