import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@bookedforreal/db";

import {
  allowedChannels,
  processDueJobs,
  remainingCredits,
  scheduleAppointmentNotifications,
} from "./notifications";

const unique = Date.now().toString(36);

let salonId = "";

beforeAll(async () => {
  const owner = await prisma.user.create({
    data: { email: `notif-${unique}@test.local`, passwordHash: "x", role: "OWNER" },
  });
  const salon = await prisma.salon.create({
    data: {
      slug: `notif-${unique}`,
      ownerId: owner.id,
      name: "Notif",
      plan: "SOLO",
      phone: "+33 6 12 34 56 78",
    },
  });
  salonId = salon.id;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TWILIO_CONTENT_CONFIRMATION;
  delete process.env.TWILIO_CONTENT_OWNER_ALERT;
});

/**
 * Drains the queue until our jobs have been handled.
 * Other test files queue jobs concurrently, so a single pass is not deterministic.
 */
async function drainQueue(): Promise<void> {
  for (let pass = 0; pass < 10; pass += 1) {
    if ((await processDueJobs()) === 0) {
      return;
    }
  }
}

afterAll(async () => {
  await prisma.job.deleteMany({ where: { type: { startsWith: "appointment." } } });
  await prisma.job.deleteMany({ where: { type: "notification.test" } });
  await prisma.salon.deleteMany({ where: { slug: `notif-${unique}` } });
  await prisma.user.deleteMany({ where: { email: `notif-${unique}@test.local` } });
  await prisma.$disconnect();
});

describe("notifications", () => {
  it("orders the channels from the cheapest to the priciest", async () => {
    expect(await allowedChannels(salonId, ["SMS", "WHATSAPP"])).toEqual(["WHATSAPP", "SMS"]);
    expect(await allowedChannels(salonId, ["WHATSAPP"])).toEqual(["WHATSAPP"]);
  });

  it("never returns an email channel", async () => {
    // `EMAIL` is gone from the channel type; a legacy payload must not resurrect it.
    const channels = await allowedChannels(salonId, ["WHATSAPP", "SMS"]);
    expect(channels).not.toContain("EMAIL");
  });

  it("grants the messaging quota of the plan", async () => {
    expect(await remainingCredits(salonId)).toBe(100);
  });

  it("queues the client confirmation, the J-1 reminder and the salon alert", async () => {
    const client = await prisma.client.create({
      data: { salonId, name: "Camille", phone: "0612345678", locale: "fr" },
    });
    const staff = await prisma.staff.create({ data: { salonId, name: "Léa" } });
    const service = await prisma.service.create({
      data: { salonId, nameFr: "Coupe", nameEn: "Haircut", durationMin: 30 },
    });
    const appointment = await prisma.appointment.create({
      data: {
        salonId,
        staffId: staff.id,
        serviceId: service.id,
        clientId: client.id,
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        endAt: new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
        source: "WEB",
      },
    });

    await scheduleAppointmentNotifications(appointment.id);

    const jobs = await prisma.job.findMany({
      where: {
        type: {
          in: ["appointment.confirmation", "appointment.reminder", "appointment.owner_alert"],
        },
        // Scoped to this appointment: other test files queue jobs in parallel.
        payload: { path: ["appointmentId"], equals: appointment.id },
      },
    });
    const types = jobs.map((job) => job.type).sort();
    expect(types).toEqual([
      "appointment.confirmation",
      "appointment.owner_alert",
      "appointment.reminder",
    ]);

    // Both recipients are normalised to E.164 before being stored.
    for (const job of jobs) {
      const payload = job.payload as unknown as { to: string; channels: string[] };
      expect(payload.to).toBe("+33612345678");
      expect(payload.channels).toEqual(["WHATSAPP", "SMS"]);
    }
  });

  it("sends over WhatsApp and records the channel used", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC_test";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_PHONE_NUMBER = "+33123456789";
    process.env.TWILIO_WHATSAPP_NUMBER = "+14155238886";
    process.env.TWILIO_CONTENT_CONFIRMATION = "HXconfirmation";
    process.env.TWILIO_CONTENT_OWNER_ALERT = "HXowner";

    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("{}", { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await drainQueue();

    const notifications = await prisma.notification.findMany({
      where: { appointment: { salonId } },
    });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications.every((notification) => notification.channel === "WHATSAPP")).toBe(true);

    // WhatsApp is addressed with the `whatsapp:` prefix and a Content template.
    // Both messages share the same runAt, so their send order is not guaranteed.
    const bodies = fetchMock.mock.calls.map((call) => String(call[1]?.body ?? ""));
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.every((body) => body.includes("whatsapp%3A%2B14155238886"))).toBe(true);
    expect(bodies.some((body) => body.includes("ContentSid=HXconfirmation"))).toBe(true);
    expect(bodies.some((body) => body.includes("ContentSid=HXowner"))).toBe(true);

    // Each sent message burns one credit.
    expect(await remainingCredits(salonId)).toBeLessThan(100);
  });

  it("falls back to SMS when no WhatsApp template is approved yet", async () => {
    const client = await prisma.client.create({
      data: { salonId, name: "Sam", phone: "0611111111", locale: "fr" },
    });
    const service = await prisma.service.findFirstOrThrow({ where: { salonId } });
    const staff = await prisma.staff.findFirstOrThrow({ where: { salonId } });
    const appointment = await prisma.appointment.create({
      data: {
        salonId,
        staffId: staff.id,
        serviceId: service.id,
        clientId: client.id,
        startAt: new Date(Date.now() + 5 * 60 * 1000),
        endAt: new Date(Date.now() + 35 * 60 * 1000),
        source: "WEB",
      },
    });

    await scheduleAppointmentNotifications(appointment.id);

    process.env.TWILIO_ACCOUNT_SID = "AC_test";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_PHONE_NUMBER = "+33123456789";
    delete process.env.TWILIO_CONTENT_CONFIRMATION;
    delete process.env.TWILIO_CONTENT_OWNER_ALERT;

    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) => new Response("{}", { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await drainQueue();

    const notifications = await prisma.notification.findMany({
      where: { appointmentId: appointment.id },
    });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications.every((notification) => notification.channel === "SMS")).toBe(true);
    const bodies = fetchMock.mock.calls.map((call) => String(call[1]?.body ?? ""));
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.every((body) => body.includes("Body="))).toBe(true);
  });
});
