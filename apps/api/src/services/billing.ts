import { AppointmentStatus, prisma } from "@bookedforreal/db";
import type Stripe from "stripe";

import { PLANS } from "../lib/plans";

/** True when the salon has reached its monthly appointment quota. */
export async function isQuotaExceeded(salonId: string): Promise<boolean> {
  return (await getRemainingQuota(salonId)) <= 0;
}

/** Remaining bookable appointments for the current month. */
export async function getRemainingQuota(salonId: string): Promise<number> {
  const salon = await prisma.salon.findUnique({ where: { id: salonId }, select: { plan: true } });
  if (!salon) {
    return 0;
  }

  const limit = PLANS[salon.plan].monthlyAppointments;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const count = await prisma.appointment.count({
    where: {
      salonId,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      createdAt: { gte: startOfMonth },
    },
  });

  return Math.max(0, limit - count);
}

/** Applies a Stripe webhook event to the salon + subscription state. */
export async function syncSubscriptionFromEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const salonId = session.metadata?.salonId;
      const plan = (session.metadata?.plan as "STARTER" | "PRO") ?? "STARTER";
      const subId = typeof session.subscription === "string" ? session.subscription : null;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      if (!salonId) {
        return;
      }

      await prisma.salon.update({
        where: { id: salonId },
        data: {
          plan,
          stripeCustomerId: customerId ?? undefined,
          stripeSubId: subId ?? undefined,
          trialEndsAt: null,
        },
      });
      await prisma.subscription.upsert({
        where: { salonId },
        update: { plan, status: "ACTIVE", stripeSubId: subId ?? undefined },
        create: { salonId, plan, status: "ACTIVE", stripeSubId: subId ?? undefined },
      });
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (!subId) {
        return;
      }
      await prisma.subscription.updateMany({
        where: { stripeSubId: subId },
        data: { status: "ACTIVE", currentPeriodEnd: new Date(invoice.period_end * 1000) },
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : null;
      if (!subId) {
        return;
      }
      await prisma.subscription.updateMany({
        where: { stripeSubId: subId },
        data: { status: "PAST_DUE" },
      });
      break;
    }
    case "customer.subscription.deleted": {
      // Stripe's dunning cancels after ~7 days of failed payments → downgrade.
      const subscription = event.data.object as Stripe.Subscription;
      const subId = subscription.id;
      await prisma.subscription.updateMany({ where: { stripeSubId: subId }, data: { status: "CANCELED" } });
      const record = await prisma.subscription.findUnique({ where: { stripeSubId: subId } });
      if (record) {
        await prisma.salon.update({
          where: { id: record.salonId },
          data: { plan: "STARTER", stripeSubId: null },
        });
      }
      break;
    }
  }
}
