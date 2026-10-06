/** Free trial applied to every plan: 7 days, cancellable at any time before it ends. */
export const TRIAL_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** End date of a trial starting now (or at the given timestamp). */
export function trialEndDate(from: number = Date.now()): Date {
  return new Date(from + TRIAL_DAYS * MS_PER_DAY);
}

/** Whole days left in the trial (0 once it has ended). */
export function trialDaysLeft(
  trialEndsAt: Date | null | undefined,
  now: number = Date.now(),
): number {
  if (!trialEndsAt) {
    return 0;
  }
  return Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / MS_PER_DAY));
}

/** Subscription statuses that grant access (Stripe keeps TRIALING while trialing). */
const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);

/**
 * True when the salon still has access: either an active subscription, or a
 * free trial that has not expired yet. No credit card is required to start.
 */
export function hasAccess(
  salon: { trialEndsAt: Date | null; subscriptionStatus?: string | null },
  now: number = Date.now(),
): boolean {
  if (salon.subscriptionStatus && ACTIVE_STATUSES.has(salon.subscriptionStatus)) {
    return true;
  }
  return Boolean(salon.trialEndsAt && salon.trialEndsAt.getTime() > now);
}
