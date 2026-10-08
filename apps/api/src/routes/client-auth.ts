import type { FastifyInstance } from "fastify";

import { prisma, type ClientAccount } from "@bookedforreal/db";
import { clientGoogleSchema, clientLoginSchema, clientRegisterSchema } from "@bookedforreal/types";

import { verifyGoogleIdToken } from "../lib/google";
import { signClientToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";

/** Rate limit, mirrors the salon-owner auth endpoints. */
const AUTH_RATE_LIMIT = { max: 5, timeWindow: "15 minutes" };

/** The account fields safe to send to a client. */
function publicAccount(account: ClientAccount) {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    emailVerified: account.emailVerified,
  };
}

/**
 * Client authentication (the customer, not the salon owner).
 * Prefix /auth/client.
 */
export async function clientAuthRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/client/register — creates an account, or adds a password to one
  // created earlier by a booking.
  app.post("/register", { config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const parsed = clientRegisterSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const email = parsed.data.email.toLowerCase();
    const name = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
    const passwordHash = await hashPassword(parsed.data.password);

    const existing = await prisma.clientAccount.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      return reply.code(409).send({ error: "EMAIL_TAKEN" });
    }

    const account = existing
      ? await prisma.clientAccount.update({ where: { email }, data: { name, passwordHash } })
      : await prisma.clientAccount.create({ data: { email, name, passwordHash } });

    // Attach any booking made under this email to the account.
    await prisma.client.updateMany({ where: { email }, data: { accountId: account.id } });

    return reply
      .code(201)
      .send({ token: signClientToken(account), account: publicAccount(account) });
  });

  // POST /auth/client/login — email + password.
  app.post("/login", { config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const parsed = clientLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const account = await prisma.clientAccount.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (
      !account?.passwordHash ||
      !(await verifyPassword(account.passwordHash, parsed.data.password))
    ) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    return { token: signClientToken(account), account: publicAccount(account) };
  });

  // POST /auth/client/google — verifies a Google ID token and signs the client in.
  app.post("/google", { config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const parsed = clientGoogleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const identity = await verifyGoogleIdToken(parsed.data.credential);
    if (!identity) {
      return reply.code(401).send({ error: "GOOGLE_NOT_CONFIGURED" });
    }

    const email = identity.email.toLowerCase();

    const account = await prisma.clientAccount.upsert({
      where: { email },
      update: { googleId: identity.googleId, name: identity.name || undefined },
      create: { email, googleId: identity.googleId, name: identity.name, emailVerified: true },
    });

    // Google already proved the inbox, so the email is verified.
    if (!account.emailVerified) {
      await prisma.clientAccount.update({
        where: { id: account.id },
        data: { emailVerified: true },
      });
    }
    await prisma.client.updateMany({ where: { email }, data: { accountId: account.id } });

    return { token: signClientToken(account), account: publicAccount(account) };
  });
}
