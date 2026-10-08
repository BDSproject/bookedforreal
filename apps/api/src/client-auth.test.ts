import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@bookedforreal/db";

import { buildApp } from "./app";

const unique = Date.now().toString(36);
const ownerEmail = `owner-${unique}@test.local`;
const clientEmail = `client-${unique}@test.local`;
const password = "StrongPass123!";
const MONDAY = "2026-01-05";

let app: ReturnType<typeof buildApp>;
let ownerToken = "";
let slug = "";
let staffId = "";
let serviceId = "";

beforeAll(async () => {
  app = buildApp();

  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: ownerEmail, password, salonName: `Client Salon ${unique}` },
  });
  slug = reg.json().salon.slug;

  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: ownerEmail, password },
  });
  ownerToken = login.json().accessToken;

  const staff = await app.inject({
    method: "POST",
    url: "/staff",
    headers: { authorization: `Bearer ${ownerToken}` },
    payload: { name: "Alex" },
  });
  staffId = staff.json().id;

  const service = await app.inject({
    method: "POST",
    url: "/services",
    headers: { authorization: `Bearer ${ownerToken}` },
    payload: { nameFr: "Coupe", nameEn: "Haircut", durationMin: 30, priceCents: 2500 },
  });
  serviceId = service.json().id;

  await app.inject({
    method: "POST",
    url: "/availability",
    headers: { authorization: `Bearer ${ownerToken}` },
    payload: { staffId, weekday: 1, startTime: "09:00", endTime: "18:00" },
  });
});

afterAll(async () => {
  await app.close();
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (owner) {
    await prisma.salon.deleteMany({ where: { ownerId: owner.id } });
    await prisma.user.delete({ where: { id: owner.id } });
  }
  await prisma.clientAccount.deleteMany({ where: { email: clientEmail } });
  await prisma.$disconnect();
});

describe("client accounts", () => {
  it("creates an unverified account when the client books", async () => {
    const booking = await app.inject({
      method: "POST",
      url: `/public/salons/${slug}/appointments`,
      payload: {
        serviceId,
        staffId,
        firstName: "Camille",
        lastName: "Dupont",
        phone: "0612345678",
        email: clientEmail,
        startAt: `${MONDAY}T09:00:00.000Z`,
      },
    });
    expect(booking.statusCode).toBe(201);

    const account = await prisma.clientAccount.findUnique({ where: { email: clientEmail } });
    expect(account).toBeTruthy();
    expect(account?.emailVerified).toBe(false);
    expect(account?.verificationToken).toBeTruthy();
  });

  it("confirms the inbox with the verification token", async () => {
    const account = await prisma.clientAccount.findUnique({ where: { email: clientEmail } });

    const res = await app.inject({
      method: "POST",
      url: "/client/verify",
      payload: { token: account!.verificationToken },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);

    const verified = await prisma.clientAccount.findUnique({ where: { email: clientEmail } });
    expect(verified?.emailVerified).toBe(true);
    expect(verified?.verificationToken).toBeNull();
  });

  it("registers a password and signs in", async () => {
    const register = await app.inject({
      method: "POST",
      url: "/auth/client/register",
      payload: { email: clientEmail, password, firstName: "Camille", lastName: "Dupont" },
    });
    expect(register.statusCode).toBe(201);
    expect(register.json().token).toBeTruthy();

    const login = await app.inject({
      method: "POST",
      url: "/auth/client/login",
      payload: { email: clientEmail, password },
    });
    expect(login.statusCode).toBe(200);

    const bad = await app.inject({
      method: "POST",
      url: "/auth/client/login",
      payload: { email: clientEmail, password: "wrong-password" },
    });
    expect(bad.statusCode).toBe(401);
  });

  it("lists the client's bookings on /client/me", async () => {
    const login = await app.inject({
      method: "POST",
      url: "/auth/client/login",
      payload: { email: clientEmail, password },
    });
    const token = login.json().token as string;

    const me = await app.inject({
      method: "GET",
      url: "/client/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().account.email).toBe(clientEmail);
    expect(me.json().bookings.length).toBe(1);
    expect(me.json().bookings[0].service.nameFr).toBe("Coupe");
  });

  it("rejects a second registration for the same email", async () => {
    const duplicate = await app.inject({
      method: "POST",
      url: "/auth/client/register",
      payload: { email: clientEmail, password, firstName: "Camille", lastName: "Dupont" },
    });
    expect(duplicate.statusCode).toBe(409);
  });
});
