import { z } from "zod";

/** Payload for the billing checkout endpoint. */
export const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO"]),
  /** Billing interval — maps to a distinct Stripe price per plan. */
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
