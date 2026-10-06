import type { SubscriptionStatus, UserRole } from "@bookedforreal/db";

declare module "fastify" {
  interface FastifyRequest {
    /** Authenticated user, attached by the `requireAuth` pre-handler. */
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
    /** Salon owned by the authenticated user, attached by `requireSalon`. */
    salon?: {
      id: string;
      slug: string;
      trialEndsAt: Date | null;
      subscriptionStatus: SubscriptionStatus | null;
    };
    /** Raw request body (fastify-raw-body), used for Stripe webhook signatures. */
    rawBody?: Buffer | string;
  }
}
