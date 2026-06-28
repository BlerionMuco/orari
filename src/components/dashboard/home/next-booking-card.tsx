import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { formatLocalTimeLabel } from "@/lib/booking/time";
import { Avatar } from "@/components/ui/media/avatar";
import { StatusBadge } from "@/components/ui/feedback/status-badge";
import type { DashboardBooking } from "@/lib/booking/queries";

export interface NextBookingCardProps {
  booking: DashboardBooking;
  timeZone: string;
}

// Hero card for the next booking on Home. Tappable → /bookings/[id]. Time +
// service + assigned resource sit above the customer row; status badge is in
// the corner.
export function NextBookingCard({
  booking,
  timeZone,
}: NextBookingCardProps): React.JSX.Element {
  const startsLabel = formatLocalTimeLabel(booking.startsAt, timeZone);
  return (
    <Link
      href={`/dashboard/bookings/${booking.id}`}
      className="group block rounded-[18px] border border-border bg-surface p-5 shadow-card transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-muted">
            Next up
          </p>
          <p className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-text">
            {startsLabel}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-text-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {booking.service.durationMin} min · {booking.service.name}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-[14px] bg-bg p-3">
        <Avatar name={booking.customerName} size="md" tone="solid" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-text">
            {booking.customerName}
          </p>
          <p className="truncate text-[12.5px] text-text-muted">
            with {booking.resource.name}
          </p>
        </div>
        <ArrowRight
          className="h-4 w-4 flex-none text-text-muted transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
