import * as React from "react";
import Link from "next/link";
import { formatLocalTimeLabel } from "@/lib/booking/time";
import { Avatar } from "@/components/ui/media/avatar";
import { StatusBadge } from "@/components/ui/feedback/status-badge";
import { ListCard } from "@/components/ui/display/list-card";
import type { DashboardBooking } from "@/lib/booking/queries";

export interface LaterTodayListProps {
  bookings: DashboardBooking[];
  timeZone: string;
}

// Compact list under the next-booking card. Stays on Home; tapping a row goes
// to the detail page. Empty bookings array hides the whole block — the caller
// uses ScreenState for the all-empty case.
export function LaterTodayList({
  bookings,
  timeZone,
}: LaterTodayListProps): React.JSX.Element | null {
  if (bookings.length === 0) return null;
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-muted">
          Later today
        </h2>
        <Link
          href="/dashboard/calendar"
          className="text-[12.5px] font-semibold text-primary"
        >
          View calendar
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {bookings.map((b) => (
          <li key={b.id}>
            <ListCard
              href={`/dashboard/bookings/${b.id}`}
              leading={<Avatar name={b.customerName} size="sm" />}
              title={
                <span className="flex items-center gap-2">
                  <span>{b.customerName}</span>
                </span>
              }
              subtitle={
                <span>
                  {formatLocalTimeLabel(b.startsAt, timeZone)} · {b.service.name} ·{" "}
                  {b.resource.name}
                </span>
              }
              trailing={<StatusBadge status={b.status} />}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
