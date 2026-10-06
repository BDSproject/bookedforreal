import type { FastifyInstance, FastifyReply } from "fastify";

import { prisma, type User } from "@bookedforreal/db";
import { loginSchema, registerSchema } from "@bookedforreal/types";

import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { trialEndDate } from "../lib/trial";
import { requireAuth } from "../middleware/auth";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

/** Rate limit applied to credential endpoints: 5 attempts / 15 minutes. */
const AUTH_RATE_LIMIT = { max: 5, timeWindow: "15 minutes" };

/** Removes sensitive fields (e.g. passwordHash) before sending a user. */
function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    locale: user.locale,
    createdAt: user.createdAt,
  };
}

/** Sets the access + refresh tokens as httpOnly cookies. */
function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string): void {
  const secure = process.env.NODE_ENV === "production";
  reply.setCookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure,
    maxAge: 15 * 60,
  });
  reply.setCookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    path: "/auth",
    sameSite: "lax",
    secure,
    maxAge: 30 * 24 * 60 * 60,
  });
}

/** Slugifies a salon name; ensures uniqueness against existing salons. */
async function uniqueSalonSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "salon";

  let slug = base;
  let suffix = 0;
  while (await prisma.salon.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // POST /auth/register — creates a User (OWNER) + their Salon with a 7-day trial (all plans).
  app.post("/register", { config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const { email, password, salonName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, role: "OWNER", locale: "fr" },
    });

    const salon = await prisma.salon.create({
      data: {
        ownerId: user.id,
        slug: await uniqueSalonSlug(salonName),
        name: salonName,
        plan: "STARTER",
        trialEndsAt: trialEndDate(),
        country: "FR",
        timezone: "Europe/Paris",
      },
    });

    return reply.code(201).send({ user: sanitizeUser(user), salon });
  });

  // POST /auth/login — verifies credentials and issues access + refresh tokens.
  app.post("/login", { config: { rateLimit: AUTH_RATE_LIMIT } }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);
    setAuthCookies(reply, accessToken, refreshToken);

    return { accessToken, user: sanitizeUser(user) };
  });

  // POST /auth/refresh — issues a new access token from a valid refresh token.
  app.post("/refresh", async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE];
    if (!token) {
      return reply.code(401).send({ error: "Missing refresh token" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return reply.code(401).send({ error: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return reply.code(401).send({ error: "User not found" });
    }

    const accessToken = signAccessToken(user);
    reply.setCookie(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60,
    });

    return { accessToken };
  });

  // POST /auth/logout — clears both auth cookies.
  app.post("/logout", async (_request, reply) => {
    reply.clearCookie(ACCESS_COOKIE, { path: "/" });
    reply.clearCookie(REFRESH_COOKIE, { path: "/auth" });
    return { ok: true };
  });

  // GET /auth/me — returns the current authenticated user.
  app.get("/me", { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user?.id;
    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    return { user: sanitizeUser(user) };
  });
}
