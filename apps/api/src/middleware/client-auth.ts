import type { FastifyReply, FastifyRequest } from "fastify";

import { verifyClientToken } from "../lib/jwt";

export interface AuthClient {
  id: string;
  email: string;
}

const CLIENT_COOKIE = "client_token";

/** Extracts the client token from the Authorization header or the httpOnly cookie. */
function extractClientToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return request.cookies[CLIENT_COOKIE] ?? null;
}

/**
 * Pre-handler that requires a valid client token and attaches `request.client`.
 * This is the customer login, distinct from the salon owner's `requireAuth`.
 */
export async function requireClientAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = extractClientToken(request);
  if (!token) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  try {
    const payload = verifyClientToken(token);
    request.client = { id: payload.sub, email: payload.email };
  } catch {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}
