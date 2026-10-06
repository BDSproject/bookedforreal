import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@bookedforreal/db";

import { isQuotaExceeded, syncSubscriptionFromEvent } from "./billing";

const unique = Date.now().toString(36);

let salonId = "";

beforeAll(async () => {
  const owner = await prisma.user.create({
    data: { email: `billing-${unique}@test.local`, passwordHash: "x", role: "OWNER" },
  });
  const salon = await prisma.salon.create({
    data: { slug: `billing-${unique}`, ownerId: owner.id, name: "Billing", plan: "SOLO" },
  });
  salonId = salon.id;
});

afterAll(async () => {
  await prisma.salon.deleteMany({ where: { slug: `billing-${unique}` } });
  await prisma.user.deleteMany({ where: { email: `billing-${unique}@test.local` } });
  await prisma.$disconnect();
});

describe("billing quota", () => {
  it("returns false when under quota", async () => {
    expect(await isQuotaExceeded(salonId)).toBe(false);
  });

  it("activates SALON on checkout.session.completed", async () => {
    await syncSubscriptionFromEvent({
      type: "checkout.session.completed",
      data: {
        object: { metadata: { salonId, plan: "SALON" }, subscription: "sub_1", customer: "cus_1" },
      },
    } as never);

    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    expect(salon?.plan).toBe("SALON");
    expect(salon?.stripeCustomerId).toBe("cus_1");
    expect(salon?.trialEndsAt).toBeNull();
  });

  it("downgrades on customer.subscription.deleted", async () => {
    await syncSubscriptionFromEvent({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1" } },
    } as never);

    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    expect(salon?.plan).toBe("SOLO");
  });
});
