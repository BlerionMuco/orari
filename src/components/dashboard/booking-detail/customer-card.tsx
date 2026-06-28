import * as React from "react";
import { AlertTriangle, Mail, Phone } from "lucide-react";
import { Avatar } from "@/components/ui/media/avatar";
import { StatusBadge } from "@/components/ui/feedback/status-badge";
import type { DashboardBooking } from "@/lib/booking/queries";

export interface CustomerCardProps {
  booking: DashboardBooking;
  noShowCount: number;
}

// Top card on the booking-detail page: avatar + name + status + tel/mail
// quick-actions + history flag if the customer has prior no-shows.
export function CustomerCard({
  booking,
  noShowCount,
}: CustomerCardProps): React.JSX.Element {
  const telHref = booking.customerPhone
    ? `tel:${booking.customerPhone.replace(/\s+/g, "")}`
    : null;
  const mailHref = booking.customerEmail ? `mailto:${booking.customerEmail}` : null;
  return (
    <section className="rounded-[18px] border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3">
        <Avatar name={booking.customerName} size="md" tone="solid" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[18px] font-semibold tracking-[-0.01em] text-text">
            {booking.customerName}
          </h1>
          <p className="mt-0.5 truncate text-[13px] text-text-muted">
            {booking.customerPhone || "No phone on file"}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      {noShowCount > 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-[12px] bg-warning-bg px-3 py-2.5 text-[12.5px] text-warning-text">
          <AlertTriangle className="mt-0.25 h-4 w-4 flex-none" aria-hidden="true" />
          <span>
            {noShowCount} previous {noShowCount === 1 ? "no-show" : "no-shows"} on
            record.
          </span>
        </div>
      ) : null}
      {telHref || mailHref ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {telHref ? (
            <a
              href={telHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-border bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-text transition-colors hover:bg-bg"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </a>
          ) : null}
          {mailHref ? (
            <a
              href={mailHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-border bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-text transition-colors hover:bg-bg"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Email
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
