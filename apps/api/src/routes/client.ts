import type { FastifyInstance } from "fastify";

import { prisma } from "@bookedforreal/db";
import { clientVerifySchema } from "@bookedforreal/types";

import { requireClientAuth } from "../middleware/client-auth";

/**
 * Client-facing endpoints (the customer's side).
 * Prefix /client.
 */
export async function clientAccountRoutes(app: FastifyInstance): Promise<void> {
  // POST /client/verify — confirms the inbox from the link sent after booking.
  app.post("/verify", async (request, reply) => {
    const parsed = clientVerifySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid token" });
    }

    const account = await prisma.clientAccount.findUnique({
      where: { verificationToken: parsed.data.token },
    });
    if (!account) {
      return reply.code(404).send({ error: "INVALID_TOKEN" });
    }

    await prisma.clientAccount.update({
      where: { id: account.id },
      data: { emailVerified: true, verificationToken: null },
    });

    return { ok: true, email: account.email };
  });

  // GET /client/me — the client's account and their bookings across salons.
  app.get("/me", { preHandler: [requireClientAuth] }, async (request) => {
    const account = await prisma.clientAccount.findUnique({
      where: { id: request.client!.id },
    });

    const bookings = await prisma.appointment.findMany({
      where: { client: { email: request.client!.email } },
      orderBy: { startAt: "desc" },
      include: {
        salon: { select: { id: true, name: true, slug: true } },
        service: {
          select: { id: true, nameFr: true, nameEn: true, durationMin: true, priceCents: true },
        },
        staff: { select: { id: true, name: true } },
      },
    });

    return {
      account: account
        ? {
            id: account.id,
            email: account.email,
            name: account.name,
            emailVerified: account.emailVerified,
          }
        : null,
      bookings,
    };
  });
}
