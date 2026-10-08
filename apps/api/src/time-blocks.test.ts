import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@bookedforreal/db";

import { buildApp } from "./app";

const unique = Date.now().toString(36);
const email = `block-${unique}@test.local`;
const password = "StrongPass123!";
const MONDAY = "2026-01-05";

let app: ReturnType<typeof buildApp>;
let token = "";
let slug = "";
let staffId = "";
let serviceId = "";

/** Slot times (local wall clock) offered for the Monday. */
async function slotTimes(): Promise<string[]> {
  const res = await app.inject({
    method: "GET",
    url: `/public/salons/${slug}/availability?date=${MONDAY}&serviceId=${serviceId}&staffId=${staffId}`,
  });
  expect(res.statusCode).toBe(200);
  const slots = res.json().slots[staffId] as { time: string }[];
  return slots.map((slot) => slot.time);
}

beforeAll(async () => {
  app = buildApp();

  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password, salonName: `Block Salon ${unique}` },
  });
  slug = reg.json().salon.slug;

  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password },
  });
  token = login.json().accessToken;

  const service = await app.inject({
    method: "POST",
    url: "/services",
    headers: { authorization: `Bearer ${token}` },
    payload: { nameFr: "Coupe", nameEn: "Haircut", durationMin: 30, priceCents: 2500 },
  });
  serviceId = service.json().id;

  const staff = await app.inject({
    method: "POST",
    url: "/staff",
    headers: { authorization: `Bearer ${token}` },
    payload: { name: "Alex" },
  });
  staffId = staff.json().id;

  // Open all Monday, 09:00–18:00 Paris (= 08:00–17:00 UTC in winter).
  await app.inject({
    method: "POST",
    url: "/availability",
    headers: { authorization: `Bearer ${token}` },
    payload: { staffId, weekday: 1, startTime: "09:00", endTime: "18:00" },
  });
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

describe("time blocks", () => {
  it("removes the blocked window from the public availability", async () => {
    const before = await slotTimes();
    expect(before.length).toBeGreaterThan(0);

    // 10:00–12:00 UTC = 11:00–13:00 Paris, inside the open window.
    const created = await app.inject({
      method: "POST",
      url: "/time-blocks",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        staffId,
        startAt: "2026-01-05T10:00:00.000Z",
        endAt: "2026-01-05T12:00:00.000Z",
        label: "Rendez-vous perso",
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().label).toBe("Rendez-vous perso");

    const after = await slotTimes();
    expect(after.length).toBeLessThan(before.length);

    // No slot starts between 11:00 and 13:00 Paris.
    const inside = after.filter((time) => time >= "11:00" && time < "13:00");
    expect(inside).toEqual([]);
  });

  it("reopens the window when the block is deleted", async () => {
    const blocks = await app.inject({
      method: "GET",
      url: "/time-blocks?from=2026-01-05T00:00:00.000Z&to=2026-01-05T23:59:59.999Z",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(blocks.json().length).toBe(1);

    const deleted = await app.inject({
      method: "DELETE",
      url: `/time-blocks/${blocks.json()[0].id}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(deleted.statusCode).toBe(200);

    const reopened = await slotTimes();
    // The first 09:00 slot is back.
    expect(reopened).toContain("09:00");
  });

  it("refuses a block whose end is before its start", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/time-blocks",
      headers: { authorization: `Bearer ${token}` },
      payload: { staffId, startAt: "2026-01-05T12:00:00.000Z", endAt: "2026-01-05T10:00:00.000Z" },
    });
    expect(res.statusCode).toBe(400);
  });
});
