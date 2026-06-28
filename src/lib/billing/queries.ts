import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businesses,
  SubscriptionStatus,
  type SubscriptionStatus as SubscriptionStatusType,
} from "@/db/schema";

export interface SubscriptionState {
  status: SubscriptionStatusType;
  trialEndsAt: Date | null;
  // Whole calendar days remaining until trial end, clamped at 0. Negative
  // values map to 0 so the UI can render "Trial ended" instead of "-3 days".
  trialDaysLeft: number;
  trialActive: boolean;
  trialEnded: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 30;

// One-row read for the billing screen. Returns the subscription scaffold
// added by migrations 0011 + 0012 (subscription_status + trial_ends_at).
// Null `trial_ends_at` is computed from `created_at + 30d` as a safety net
// for rows that slipped through between 0011 (no default) and 0012 (default
// added). No write surface yet — Paddle/Lemon Squeezy is out of V1.
export async function getSubscriptionState(
  businessId: string,
  now: Date = new Date(),
): Promise<SubscriptionState> {
  const [row] = await db
    .select({
      status: businesses.subscriptionStatus,
      trialEndsAt: businesses.trialEndsAt,
      createdAt: businesses.createdAt,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const status: SubscriptionStatusType = row?.status ?? SubscriptionStatus.TRIAL;
  const trialEndsAt =
    row?.trialEndsAt ??
    (row?.createdAt
      ? new Date(row.createdAt.getTime() + TRIAL_DAYS * MS_PER_DAY)
      : null);

  const msLeft = trialEndsAt ? trialEndsAt.getTime() - now.getTime() : 0;
  const trialDaysLeft = Math.max(0, Math.ceil(msLeft / MS_PER_DAY));
  const trialActive = status === SubscriptionStatus.TRIAL && msLeft > 0;
  const trialEnded =
    status === SubscriptionStatus.TRIAL && trialEndsAt !== null && msLeft <= 0;

  return {
    status,
    trialEndsAt,
    trialDaysLeft,
    trialActive,
    trialEnded,
  };
}
