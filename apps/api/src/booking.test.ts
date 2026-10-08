import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@bookedforreal/db";

import { buildApp } from "./app";
import { signAccessToken } from "./lib/jwt";
import { requireAuth } from "./middleware/auth";
import { requireSalon } from "./middleware/salon";

const unique = Date.now().toString(36);
const email = `booking-${unique}@test.local`;
const password = "StrongPass123!";
const salonName = `Booking Salon ${unique}`;

let app: ReturnType<typeof buildApp>;
let token = "";
let slug = "";
let serviceId = "";
let staffId = "";
let availabilityId = "";
let bookedStartAt = "";

beforeAll(async () => {
  app = buildApp();

  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password, salonName },
  });
  expect(reg.statusCode).toBe(201);
  slug = reg.json().salon.slug;

  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password },
  });
  token = login.json().accessToken;

  const svc = await app.inject({
    method: "POST",
    url: "/services",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      nameFr: "Coupe",
      nameEn: "Haircut",
      durationMin: 30,
      priceCents: 2500,
      bufferMin: 5,
    },
  });
  serviceId = svc.json().id;

  const st = await app.inject({
    method: "POST",
    url: "/staff",
    headers: { authorization: `Bearer ${token}` },
    payload: { name: "Alex" },
  });
  staffId = st.json().id;

  const avail = await app.inject({
    method: "POST",
    url: "/availability",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      staffId,
      weekday: 1,
      startTime: "09:00",
      endTime: "18:00",
      breakStart: "12:00",
      breakEnd: "13:00",
    },
  });
  availabilityId = avail.json().id;
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

describe("public booking", () => {
  it("returns salon info + services + staff + hours", async () => {
    const res = await app.inject({ method: "GET", url: `/public/salons/${slug}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.slug).toBe(slug);
    expect(body.services.length).toBe(1);
    expect(body.staff.length).toBe(1);
    expect(body.availabilities.length).toBe(1);
  });

  it("returns free slots for a Monday, excluding the break", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/public/salons/${slug}/availability?date=2026-01-05&serviceId=${serviceId}&staffId=${staffId}`,
    });
    expect(res.statusCode).toBe(200);
    const slots = res.json().slots[staffId] as Array<{ time: string; startAt: string }>;

    expect(slots.length).toBeGreaterThan(0);
    expect(slots.some((s) => s.time === "09:00")).toBe(true);
    expect(slots.some((s) => s.time === "12:00")).toBe(false);
  });

  it("returns a week of slots in one call", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/public/salons/${slug}/availability/range?serviceId=${serviceId}&staffId=${staffId}&from=2026-01-05&days=3`,
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.from).toBe("2026-01-05");
    expect(body.days).toBe(3);
    expect(Object.keys(body.slots)).toHaveLength(3);

    // The break applies every day, so no slot around midday on any of the three.
    for (const date of Object.keys(body.slots) as string[]) {
      const slots = body.slots[date][staffId] as Array<{ time: string }>;
      expect(slots.some((s) => s.time === "12:00")).toBe(false);
    }
  });

  it("creates an appointment and exposes its status", async () => {
    const avail = await app.inject({
      method: "GET",
      url: `/public/salons/${slug}/availability?date=2026-01-05&serviceId=${serviceId}&staffId=${staffId}`,
    });
    const slot = (avail.json().slots[staffId] as Array<{ time: string; startAt: string }>)[0];
    bookedStartAt = slot!.startAt;

    const res = await app.inject({
      method: "POST",
      url: `/public/salons/${slug}/appointments`,
      payload: {
        serviceId,
        staffId,
        name: "Jane Doe",
        phone: "+33612345678",
        email: `jane-${unique}@test.local`,
        startAt: bookedStartAt,
      },
    });
    expect(res.statusCode).toBe(201);

    const status = await app.inject({
      method: "GET",
      url: `/public/salons/${slug}/appointments/${res.json().id}`,
    });
    expect(status.statusCode).toBe(200);
    expect(status.json().status).toBe("PENDING");
  });

  it("rejects a double booking for the same slot", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/public/salons/${slug}/appointments`,
      payload: {
        serviceId,
        staffId,
        name: "John Doe",
        phone: "+33699999999",
        startAt: bookedStartAt,
      },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe("protected endpoints", () => {
  it("returns the salon for GET /salons/me", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/salons/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().salon.slug).toBe(slug);
  });

  it("lists appointments for GET /appointments", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/appointments",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().length).toBeGreaterThan(0);
  });

  it("confirms an appointment with PATCH /appointments/:id", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/appointments",
      headers: { authorization: `Bearer ${token}` },
    });
    const appointment = list.json()[0];

    const res = await app.inject({
      method: "PATCH",
      url: `/appointments/${appointment.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: "CONFIRMED" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("CONFIRMED");
  });

  it("lists clients for GET /clients", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/clients",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().length).toBeGreaterThan(0);
  });

  it("returns dashboard stats for GET /stats/dashboard", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/stats/dashboard",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(typeof res.json().appointmentsToday).toBe("number");
  });

  it("rejects protected endpoints without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/appointments" });
    expect(res.statusCode).toBe(401);
  });
});

describe("management CRUD", () => {
  it("PATCH /salons/me updates the salon", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/salons/me",
      headers: { authorization: `Bearer ${token}` },
      payload: { description: "Updated description" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().salon.description).toBe("Updated description");
  });

  it("PATCH /services/:id updates a service", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/services/${serviceId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { priceCents: 3000 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().priceCents).toBe(3000);
  });

  it("PATCH /staff/:id updates a staff member", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/staff/${staffId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Alex Updated" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe("Alex Updated");
  });

  it("PATCH /availability/:id updates availability", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/availability/${availabilityId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { startTime: "10:00" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("POST /appointments creates a manual appointment", async () => {
    const clients = await app.inject({
      method: "GET",
      url: "/clients",
      headers: { authorization: `Bearer ${token}` },
    });
    const clientId = clients.json()[0].id;

    const res = await app.inject({
      method: "POST",
      url: "/appointments",
      headers: { authorization: `Bearer ${token}` },
      payload: { clientId, staffId, serviceId, startAt: "2026-01-06T09:00:00.000Z" },
    });
    expect(res.statusCode).toBe(201);
  });

  it("filters appointments by status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/appointments?status=CONFIRMED",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().every((a: { status: string }) => a.status === "CONFIRMED")).toBe(true);
  });

  it("DELETE /availability/:id deletes availability", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/availability/${availabilityId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it("DELETE /services/:id soft-deletes a service", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/services/${serviceId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it("DELETE /staff/:id soft-deletes a staff member", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/staff/${staffId}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("error handling", () => {
  it("returns 404 for an unknown public salon", async () => {
    const res = await app.inject({ method: "GET", url: "/public/salons/does-not-exist" });
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for an invalid availability query", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/public/salons/${slug}/availability?date=bad-date&serviceId=${serviceId}`,
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for an invalid service payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/services",
      headers: { authorization: `Bearer ${token}` },
      payload: { nameFr: "Only French" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for an unknown service", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/services/unknown-id",
      headers: { authorization: `Bearer ${token}` },
      payload: { priceCents: 100 },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 400 for an invalid appointment status", async () => {
    const list = await app.inject({
      method: "GET",
      url: "/appointments",
      headers: { authorization: `Bearer ${token}` },
    });
    const id = list.json()[0].id;

    const res = await app.inject({
      method: "PATCH",
      url: `/appointments/${id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: "BOGUS" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for an unknown appointment", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/appointments/unknown-id",
      headers: { authorization: `Bearer ${token}` },
      payload: { status: "CONFIRMED" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 404 for an unknown availability", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/availability/unknown-id",
      headers: { authorization: `Bearer ${token}` },
      payload: { startTime: "10:00" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("returns 404 for an unknown staff member", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/staff/unknown-id",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Ghost" },
    });
    expect(res.statusCode).toBe(404);
  });

  it("requireSalon without auth returns 401", async () => {
    const guardApp = buildApp();
    guardApp.get("/salon-only", { preHandler: [requireSalon] }, async () => ({ ok: true }));
    const res = await guardApp.inject({ method: "GET", url: "/salon-only" });
    expect(res.statusCode).toBe(401);
    await guardApp.close();
  });

  it("requireSalon returns 404 when the user owns no salon", async () => {
    const noSalonUser = await prisma.user.create({
      data: { email: `nosalon-${unique}@test.local`, passwordHash: "x", role: "STAFF" },
    });

    const guardApp = buildApp();
    guardApp.get("/salon-only", { preHandler: [requireAuth, requireSalon] }, async () => ({
      ok: true,
    }));
    const res = await guardApp.inject({
      method: "GET",
      url: "/salon-only",
      headers: { authorization: `Bearer ${signAccessToken(noSalonUser)}` },
    });
    expect(res.statusCode).toBe(404);

    await guardApp.close();
    await prisma.user.delete({ where: { id: noSalonUser.id } });
  });
});
