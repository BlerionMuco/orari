import * as React from "react";
import { formatLocalTimeLabel } from "@/lib/booking/time";
import { Avatar } from "@/components/ui/media/avatar";
import { StatusBadge } from "@/components/ui/feedback/status-badge";
import { ListCard } from "@/components/ui/display/list-card";
import type { DashboardBooking } from "@/lib/booking/queries";

export interface BookingListProps {
  bookings: DashboardBooking[];
  timeZone: string;
  showResource?: boolean;
}

// Chronological list of bookings for the calendar / day view. Resource name is
// suppressed when the page is filtered to a single resource (avoids redundant
// repetition on each row).
export function BookingList({
  bookings,
  timeZone,
  showResource = true,
}: BookingListProps): React.JSX.Element {
  return (
    <ul className="flex flex-col gap-2">
      {bookings.map((b) => {
        const time = formatLocalTimeLabel(b.startsAt, timeZone);
        const dim =
          b.status === "cancelled" || b.status === "no_show" || b.status === "completed";
        return (
          <li key={b.id}>
            <ListCard
              href={`/dashboard/bookings/${b.id}`}
              leading={<Avatar name={b.customerName} size="sm" />}
              title={
                <span className="flex items-center gap-2">
                  <span className="text-text-muted">{time}</span>
                  <span aria-hidden="true" className="text-text-disabled">·</span>
                  <span>{b.customerName}</span>
                </span>
              }
              subtitle={
                <span>
                  {b.service.name}
                  {showResource ? ` · ${b.resource.name}` : ""}
                </span>
              }
              trailing={<StatusBadge status={b.status} />}
              dim={dim}
            />
          </li>
        );
      })}
    </ul>
  );
}
