import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@bookedforreal/db";

import { buildApp } from "./app";
import { signRefreshToken } from "./lib/jwt";
import { requireAuth, requireRole } from "./middleware/auth";

const unique = Date.now().toString(36);
const email = `auth-${unique}@test.local`;
const password = "StrongPass123!";
const salonName = `Salon ${unique}`;

let app: ReturnType<typeof buildApp>;
let userId = "";
let accessToken = "";

beforeAll(async () => {
  app = buildApp();

  const register = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password, salonName },
  });
  expect(register.statusCode).toBe(201);
  userId = register.json().user.id;

  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password },
  });
  expect(login.statusCode).toBe(200);
  expect(login.headers["set-cookie"]).toBeTruthy();
  accessToken = login.json().accessToken;
  expect(accessToken).toBeTruthy();
});

afterAll(async () => {
  await app.close();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.salon.deleteMany({ where: { ownerId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.$disconnect();
});

describe("auth", () => {
  it("rejects a duplicate registration", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email, password, salonName: "Another Salon" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects an invalid registration payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email, password: "short", salonName },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email, password: "WrongPass123!" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for /me without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("returns the current user for /me with a Bearer token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.email).toBe(email);
  });

  it("returns the current user for /me with the httpOnly cookie", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { access_token: accessToken },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.email).toBe(email);
  });

  it("refreshes the access token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: { refresh_token: signRefreshToken(userId) },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().accessToken).toBeTruthy();
  });

  it("rejects /me with an invalid token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: "Bearer invalid.token.here" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("requireRole", () => {
  it("blocks a role that is not allowed", async () => {
    const guardApp = buildApp();
    guardApp.get("/admin-only", { preHandler: [requireAuth, requireRole("ADMIN")] }, async () => ({ ok: true }));

    const res = await guardApp.inject({
      method: "GET",
      url: "/admin-only",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(403);

    await guardApp.close();
  });
});
