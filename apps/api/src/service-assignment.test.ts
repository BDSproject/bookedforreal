import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@bookedforreal/db";

import { buildApp } from "./app";

const unique = Date.now().toString(36);
const email = `assign-${unique}@test.local`;
const password = "StrongPass123!";

let app: ReturnType<typeof buildApp>;
let token = "";
let slug = "";
let alexId = "";
let samId = "";
/** Monday, so the availability below always matches. */
const MONDAY = "2026-01-05";

/** Creates a service through the API and returns its body. */
async function createService(payload: Record<string, unknown>) {
  const res = await app.inject({
    method: "POST",
    url: "/services",
    headers: { authorization: `Bearer ${token}` },
    payload: { nameFr: "Coupe", nameEn: "Haircut", durationMin: 30, priceCents: 2500, ...payload },
  });
  expect(res.statusCode).toBe(201);
  return res.json();
}

beforeAll(async () => {
  app = buildApp();

  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password, salonName: `Assign Salon ${unique}` },
  });
  slug = reg.json().salon.slug;

  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password },
  });
  token = login.json().accessToken;

  // Two hairdressers, both open on Monday.
  for (const name of ["Alex", "Sam"]) {
    const staff = await app.inject({
      method: "POST",
      url: "/staff",
      headers: { authorization: `Bearer ${token}` },
      payload: { name },
    });
    const id = staff.json().id;
    if (name === "Alex") alexId = id;
    else samId = id;

    await app.inject({
      method: "POST",
      url: "/availability",
      headers: { authorization: `Bearer ${token}` },
      payload: { staffId: id, weekday: 1, startTime: "09:00", endTime: "18:00" },
    });
  }
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

describe("price-list categories", () => {
  it("creates a category and groups a service into it", async () => {
    const category = await app.inject({
      method: "POST",
      url: "/service-categories",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Coupes" },
    });
    expect(category.statusCode).toBe(201);

    const service = await createService({ categoryId: category.json().id });
    expect(service.category?.name).toBe("Coupes");

    const list = await app.inject({
      method: "GET",
      url: "/services",
      headers: { authorization: `Bearer ${token}` },
    });
    const stored = list.json().find((item: { id: string }) => item.id === service.id);
    expect(stored.category.name).toBe("Coupes");
  });

  it("refuses a duplicate category name inside the same salon", async () => {
    const duplicate = await app.inject({
      method: "POST",
      url: "/service-categories",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Coupes" },
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it("refuses a category that belongs to nobody", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/services",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        nameFr: "Coupe",
        nameEn: "Haircut",
        durationMin: 30,
        categoryId: "not-a-category",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("keeps the services when a category is deleted", async () => {
    const category = await app.inject({
      method: "POST",
      url: "/service-categories",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "À supprimer" },
    });
    const service = await createService({ categoryId: category.json().id });

    const deleted = await app.inject({
      method: "DELETE",
      url: `/service-categories/${category.json().id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(deleted.statusCode).toBe(200);

    const list = await app.inject({
      method: "GET",
      url: "/services",
      headers: { authorization: `Bearer ${token}` },
    });
    const stored = list.json().find((item: { id: string }) => item.id === service.id);
    expect(stored).toBeTruthy();
    expect(stored.category).toBeNull();
  });
});

describe("service assignment to staff", () => {
  it("offers an unassigned service to the whole team", async () => {
    const service = await createService({ nameFr: "Ouverte à tous", nameEn: "Open to all" });
    expect(service.staff).toEqual([]);

    const res = await app.inject({
      method: "GET",
      url: `/public/salons/${slug}/availability?date=${MONDAY}&serviceId=${service.id}`,
    });
    expect(res.statusCode).toBe(200);
    expect(Object.keys(res.json().slots).sort()).toEqual([alexId, samId].sort());
  });

  it("only offers an assigned service to the staff who can do it", async () => {
    const service = await createService({
      nameFr: "Coupe femme",
      nameEn: "Women's cut",
      staffIds: [alexId],
    });
    expect(service.staff.map((member: { id: string }) => member.id)).toEqual([alexId]);

    const res = await app.inject({
      method: "GET",
      url: `/public/salons/${slug}/availability?date=${MONDAY}&serviceId=${service.id}`,
    });
    expect(Object.keys(res.json().slots)).toEqual([alexId]);
  });

  it("returns no slot for a staff member who cannot do the service", async () => {
    const service = await createService({
      nameFr: "Barbe",
      nameEn: "Beard trim",
      staffIds: [alexId],
    });

    const res = await app.inject({
      method: "GET",
      url: `/public/salons/${slug}/availability?date=${MONDAY}&serviceId=${service.id}&staffId=${samId}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().slots).toEqual({});
  });

  it("refuses a booking with a staff member who cannot do the service", async () => {
    const service = await createService({
      nameFr: "Coloration",
      nameEn: "Colouring",
      staffIds: [alexId],
    });

    const res = await app.inject({
      method: "POST",
      url: `/public/salons/${slug}/appointments`,
      payload: {
        serviceId: service.id,
        staffId: samId,
        name: "Client Test",
        phone: "0612345678",
        startAt: `${MONDAY}T09:00:00.000Z`,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("Staff cannot perform this service");
  });

  it("accepts the booking when the staff member can do it", async () => {
    const service = await createService({
      nameFr: "Coupe enfant",
      nameEn: "Kids cut",
      staffIds: [alexId],
    });

    const res = await app.inject({
      method: "POST",
      url: `/public/salons/${slug}/appointments`,
      payload: {
        serviceId: service.id,
        staffId: alexId,
        name: "Client Test",
        phone: "0612345678",
        startAt: `${MONDAY}T09:00:00.000Z`,
      },
    });
    expect(res.statusCode).toBe(201);
  });

  it("reopens a service to everyone when the assignment is cleared", async () => {
    const service = await createService({ staffIds: [alexId] });

    const cleared = await app.inject({
      method: "PATCH",
      url: `/services/${service.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { staffIds: [] },
    });
    expect(cleared.statusCode).toBe(200);
    expect(cleared.json().staff).toEqual([]);
  });
});

describe("per-hairdresser statistics", () => {
  it("counts what each hairdresser did over the period", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/stats/staff?from=${MONDAY}&to=${MONDAY}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.from).toBe(MONDAY);
    expect(body.to).toBe(MONDAY);
    expect(body.staff.map((row: { name: string }) => row.name).sort()).toEqual(["Alex", "Sam"]);

    const alex = body.staff.find((row: { name: string }) => row.name === "Alex");
    const sam = body.staff.find((row: { name: string }) => row.name === "Sam");
    expect(alex.bookings).toBeGreaterThan(0);
    expect(sam.bookings).toBe(0);
    expect(body.totals.bookings).toBe(alex.bookings);
  });

  it("rejects a malformed period", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/stats/staff?from=05/01/2026",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(400);
  });
});
