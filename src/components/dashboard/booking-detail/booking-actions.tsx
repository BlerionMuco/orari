"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, UserX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { useConfirm } from "@/lib/ui/use-confirm";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { BookingStatus } from "@/db/schema";
import {
  cancelBookingAction,
  markBookingCompleteAction,
  markBookingNoShowAction,
} from "@/app/(dashboard)/dashboard/bookings/actions";
import type { DashboardBooking } from "@/lib/booking/queries";

export interface BookingActionsProps {
  booking: DashboardBooking;
}

// Owner / staff status transitions on the booking-detail page. Each action
// confirms (where destructive), calls a server action, then shows a toast +
// routes back to Calendar so the dashboard reflects the new state without
// needing the user to navigate manually.
export function BookingActions({ booking }: BookingActionsProps): React.JSX.Element | null {
  const router = useRouter();
  const confirm = useConfirm((s) => s.confirm);
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();

  const canTransition = booking.status === BookingStatus.CONFIRMED;
  if (!canTransition) {
    return (
      <p className="mt-4 rounded-[12px] bg-fill-subtle px-3 py-2.5 text-center text-[12.5px] text-text-muted">
        {statusNote(booking.status)}
      </p>
    );
  }

  const run = (
    action: () => Promise<{ ok: boolean; error?: string }>,
    okMessage: string,
  ): void => {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        show(res.error ?? "Something went wrong.", ToastVariant.ERROR);
        return;
      }
      show(okMessage);
      router.push("/dashboard/calendar");
      router.refresh();
    });
  };

  const onComplete = (): void => {
    run(() => markBookingCompleteAction({ bookingId: booking.id }), "Marked complete");
  };

  const onNoShow = async (): Promise<void> => {
    const accepted = await confirm({
      title: "Mark as no-show?",
      body: `${booking.customerName} will be recorded as a no-show. This affects their booking history.`,
      confirmLabel: "Mark no-show",
      danger: true,
    });
    if (!accepted) return;
    run(() => markBookingNoShowAction({ bookingId: booking.id }), "Marked as no-show");
  };

  const onCancel = async (): Promise<void> => {
    const accepted = await confirm({
      title: "Cancel this booking?",
      body: `The slot will free up and ${booking.customerName} will be notified.`,
      confirmLabel: "Cancel booking",
      danger: true,
    });
    if (!accepted) return;
    run(() => cancelBookingAction({ bookingId: booking.id }), "Booking cancelled");
  };

  // Reschedule lands with the manual-booking surface (M5). Until that ships,
  // keep the button visible (operators expect it from the design) but disable
  // it with a tooltip-style title so users get a hint, not a broken route.
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Button variant="primary" size="lg" onClick={onComplete} loading={pending}>
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Complete
      </Button>
      <Button
        variant="outline"
        size="lg"
        type="button"
        disabled
        title="Coming soon"
        aria-label="Reschedule — coming soon"
      >
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
        Reschedule
      </Button>
      <Button variant="outline" size="lg" onClick={onNoShow} disabled={pending}>
        <UserX className="h-4 w-4" aria-hidden="true" />
        No-show
      </Button>
      <Button variant="danger" size="lg" onClick={onCancel} disabled={pending}>
        <XCircle className="h-4 w-4" aria-hidden="true" />
        Cancel
      </Button>
    </div>
  );
}

function statusNote(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.COMPLETED:
      return "This booking is complete.";
    case BookingStatus.NO_SHOW:
      return "Marked as a no-show.";
    case BookingStatus.CANCELLED:
      return "This booking was cancelled.";
    default:
      return "";
  }
}
