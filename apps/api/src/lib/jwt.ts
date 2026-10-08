import jwt from "jsonwebtoken";

import type { UserRole } from "@bookedforreal/db";

/** Access token payload (short-lived, used for authentication). */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: "access";
}

/** Refresh token payload (long-lived, only used to issue new access tokens). */
export interface RefreshTokenPayload {
  sub: string;
  type: "refresh";
}

/** Client access token — the "customer" side, distinct from the salon owner. */
export interface ClientTokenPayload {
  sub: string;
  email: string;
  type: "client";
}

const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const CLIENT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function accessSecret(): string {
  return process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
}

function refreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";
}

function clientSecret(): string {
  return process.env.JWT_CLIENT_SECRET ?? process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
}

/** Signs a short-lived access token for the given user. */
export function signAccessToken(user: { id: string; email: string; role: UserRole }): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: "access",
  };
  return jwt.sign(payload, accessSecret(), { expiresIn: ACCESS_TTL_SECONDS });
}

/** Signs a long-lived refresh token for the given user id. */
export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: "refresh" };
  return jwt.sign(payload, refreshSecret(), { expiresIn: REFRESH_TTL_SECONDS });
}

/** Verifies and decodes an access token; throws if invalid or wrong type. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, accessSecret());
  if (typeof decoded === "string" || decoded.type !== "access") {
    throw new Error("Invalid access token");
  }
  return decoded as unknown as AccessTokenPayload;
}

/** Verifies and decodes a refresh token; throws if invalid or wrong type. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, refreshSecret());
  if (typeof decoded === "string" || decoded.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return decoded as unknown as RefreshTokenPayload;
}

/** Signs a long-lived client token (used for the client login). */
export function signClientToken(account: { id: string; email: string }): string {
  const payload: ClientTokenPayload = { sub: account.id, email: account.email, type: "client" };
  return jwt.sign(payload, clientSecret(), { expiresIn: CLIENT_TTL_SECONDS });
}

/** Verifies a client token; throws if invalid or wrong type. */
export function verifyClientToken(token: string): ClientTokenPayload {
  const decoded = jwt.verify(token, clientSecret());
  if (typeof decoded === "string" || decoded.type !== "client") {
    throw new Error("Invalid client token");
  }
  return decoded as unknown as ClientTokenPayload;
}
