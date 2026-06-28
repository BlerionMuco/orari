import * as React from "react";
import { CalendarClock } from "lucide-react";
import { SectionCard } from "@/components/ui/display/section-card";
import { cn } from "@/lib/utils";
import { SubscriptionStatus, type SubscriptionStatus as SubscriptionStatusType } from "@/db/schema";

export interface TrialStatusCardProps {
  status: SubscriptionStatusType;
  trialEndsAt: Date | null;
  trialDaysLeft: number;
  trialActive: boolean;
  trialEnded: boolean;
}

interface Pill {
  label: string;
  className: string;
}

function statusPill(props: TrialStatusCardProps): Pill {
  if (props.trialActive) {
    return {
      label: "Trial",
      className: "bg-primary-tint text-primary-pressed",
    };
  }
  if (props.trialEnded) {
    return { label: "Trial ended", className: "bg-warning-bg text-warning-text" };
  }
  switch (props.status) {
    case SubscriptionStatus.ACTIVE:
      return { label: "Active", className: "bg-success-bg text-success-text" };
    case SubscriptionStatus.PAST_DUE:
      return { label: "Past due", className: "bg-warning-bg text-warning-text" };
    case SubscriptionStatus.CANCELLED:
      return { label: "Cancelled", className: "bg-danger-bg text-danger-text" };
    default:
      return { label: "Trial", className: "bg-primary-tint text-primary-pressed" };
  }
}

function formatTrialEnd(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// Top-of-page status card. Surfaces trial countdown when in trial; falls back
// to the raw subscription status pill once the trial ends (or once a paid
// plan exists — though paid is out of V1).
export function TrialStatusCard(
  props: TrialStatusCardProps,
): React.JSX.Element {
  const pill = statusPill(props);
  const subtitle = props.trialActive
    ? `${props.trialDaysLeft} day${props.trialDaysLeft === 1 ? "" : "s"} left`
    : props.trialEnded
      ? "Pick a plan to keep accepting bookings."
      : props.status === SubscriptionStatus.ACTIVE
        ? "Your subscription is active."
        : "No active subscription.";

  return (
    <SectionCard>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary-tint text-primary-pressed">
          <CalendarClock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[15.5px] font-semibold tracking-[-0.01em] text-text">
              {props.trialActive ? "Free trial" : "Subscription"}
            </h2>
            <span
              className={cn(
                "inline-flex h-6 flex-none items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em]",
                pill.className,
              )}
            >
              {pill.label}
            </span>
          </div>
          <p className="mt-1 text-[13.5px] text-text-muted">{subtitle}</p>
          {props.trialEndsAt ? (
            <p className="mt-2 text-[12.5px] text-text-muted">
              Trial ends {formatTrialEnd(props.trialEndsAt)}
            </p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
