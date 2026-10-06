/**
 * Trial / access rules used by the web app.
 * Mirrors `apps/api/src/lib/trial.ts` — keep the two in sync.
 */
export const TRIAL_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Subscription statuses that grant access. */
const ACTIVE_STATUSES = new Set(["ACTIVE", "TRIALING"]);

/** Whole days left in the trial (0 once it has ended). */
export function trialDaysLeft(trialEndsAt: Date | null | undefined, now: number = Date.now()): number {
  if (!trialEndsAt) {
    return 0;
  }
  return Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / MS_PER_DAY));
}

/** True when the salon has an active subscription or a running free trial. */
export function hasAccess(
  salon: { trialEndsAt: Date | null; subscriptionStatus?: string | null },
  now: number = Date.now(),
): boolean {
  if (salon.subscriptionStatus && ACTIVE_STATUSES.has(salon.subscriptionStatus)) {
    return true;
  }
  return Boolean(salon.trialEndsAt && salon.trialEndsAt.getTime() > now);
}
