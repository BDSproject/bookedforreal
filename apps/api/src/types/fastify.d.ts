import type { UserRole } from "@bookedforreal/db";

declare module "fastify" {
  interface FastifyRequest {
    /** Authenticated user, attached by the `requireAuth` pre-handler. */
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}
