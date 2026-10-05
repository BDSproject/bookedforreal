import type { FastifyReply, FastifyRequest } from "fastify";

import type { UserRole } from "@bookedforreal/db";

import { verifyAccessToken } from "../lib/jwt";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

const ACCESS_COOKIE = "access_token";

/** Extracts the access token from the Authorization header or the httpOnly cookie. */
function extractAccessToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return request.cookies[ACCESS_COOKIE] ?? null;
}

/**
 * Pre-handler that requires a valid access token and attaches `request.user`.
 * Rejects with 401 otherwise.
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractAccessToken(request);
  if (!token) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  try {
    const payload = verifyAccessToken(token);
    request.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}

/**
 * Factory returning a pre-handler that requires `request.user` to have one of
 * the given roles. Must be used AFTER `requireAuth`. Rejects with 403 otherwise.
 */
export function requireRole(...roles: UserRole[]) {
  return async function roleGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = request.user;
    if (!user || !roles.includes(user.role)) {
      return reply.code(403).send({ error: "Forbidden" });
    }
  };
}
