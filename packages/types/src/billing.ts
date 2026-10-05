import { z } from "zod";

/** Payload for the billing checkout endpoint. */
export const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
