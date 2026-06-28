import * as React from "react";
import { CalendarDays, Clock, Scissors, User } from "lucide-react";
import { formatLocalTimeLabel } from "@/lib/booking/time";
import { formatPrice } from "@/lib/booking/slots-view";
import { DatePill } from "@/components/ui/date/date-pill";
import { SectionCard } from "@/components/ui/display/section-card";
import type { DashboardBooking } from "@/lib/booking/queries";

export interface BookingMetaProps {
  booking: DashboardBooking;
  timeZone: string;
  currency: string;
  todayIso: string;
  selectedIso: string;
}

// Service + when + resource + price summary block. Compact key/value rows so
// the detail page reads at a glance.
export function BookingMeta({
  booking,
  timeZone,
  currency,
  todayIso,
  selectedIso,
}: BookingMetaProps): React.JSX.Element {
  const start = formatLocalTimeLabel(booking.startsAt, timeZone);
  const end = formatLocalTimeLabel(booking.endsAt, timeZone);
  return (
    <SectionCard className="mt-3">
      <ul className="flex flex-col gap-3">
        <Row icon={<Scissors className="h-4 w-4" />} label="Service" value={booking.service.name} />
        <Row
          icon={<Clock className="h-4 w-4" />}
          label="Time"
          value={`${start} – ${end} (${booking.service.durationMin} min)`}
        />
        <Row
          icon={<CalendarDays className="h-4 w-4" />}
          label="Date"
          value={<DatePill iso={selectedIso} todayIso={todayIso} />}
        />
        <Row icon={<User className="h-4 w-4" />} label="With" value={booking.resource.name} />
        <Row
          icon={<span className="block h-4 w-4 text-center text-[13px] font-semibold">¤</span>}
          label="Price"
          value={formatPrice(booking.service.priceCents, currency)}
        />
      </ul>
    </SectionCard>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-primary-tint text-primary">
        {icon}
      </span>
      <span className="flex-1 text-[13px] text-text-muted">{label}</span>
      <span className="text-[13.5px] font-semibold text-text">{value}</span>
    </li>
  );
}
