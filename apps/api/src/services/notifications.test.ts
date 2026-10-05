import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@bookedforreal/db";

import { allowedChannels, enqueueNotification, processDueJobs } from "./notifications";

const unique = Date.now().toString(36);

let salonId = "";

beforeAll(async () => {
  const owner = await prisma.user.create({
    data: { email: `notif-${unique}@test.local`, passwordHash: "x", role: "OWNER" },
  });
  const salon = await prisma.salon.create({
    data: { slug: `notif-${unique}`, ownerId: owner.id, name: "Notif", plan: "STARTER" },
  });
  salonId = salon.id;
});

afterAll(async () => {
  await prisma.salon.deleteMany({ where: { slug: `notif-${unique}` } });
  await prisma.user.deleteMany({ where: { email: `notif-${unique}@test.local` } });
  await prisma.$disconnect();
});

describe("notifications", () => {
  it("restricts STARTER to email only", async () => {
    expect(await allowedChannels(salonId, ["WHATSAPP", "SMS", "EMAIL"])).toEqual(["EMAIL"]);
  });

  it("enqueues and processes a job to DONE", async () => {
    const job = await enqueueNotification({
      type: "notification.test",
      runAt: new Date(),
      payload: { salonId, to: "owner@test.local", message: "Hello", channels: ["EMAIL"] },
    });
    expect(job?.id).toBeTruthy();

    const handled = await processDueJobs();
    expect(handled).toBeGreaterThanOrEqual(1);

    const updated = await prisma.job.findUnique({ where: { id: job!.id } });
    expect(updated?.status).toBe("DONE");
  });
});
