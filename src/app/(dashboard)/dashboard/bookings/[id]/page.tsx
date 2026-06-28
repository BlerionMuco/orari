import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import {
  countNoShowsForCustomer,
  getBookingDetail,
  getResourceForUser,
} from "@/lib/booking/queries";
import { localIsoDate } from "@/lib/booking/time";
import { PageHeader } from "@/components/ui/nav/page-header";
import { SectionCard } from "@/components/ui/display/section-card";
import { CustomerCard } from "@/components/dashboard/booking-detail/customer-card";
import { BookingMeta } from "@/components/dashboard/booking-detail/booking-meta";
import { BookingActions } from "@/components/dashboard/booking-detail/booking-actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  const scope = businessScope(business.id);

  const booking = await getBookingDetail(scope, id);
  if (!booking) notFound();

  // Staff can only open detail for their own resource's bookings.
  if (business.role === "staff") {
    const own = await getResourceForUser(scope, user.id);
    if (!own || own.id !== booking.resource.id) redirect("/dashboard/restricted");
  }

  const noShowCount = await countNoShowsForCustomer(
    scope,
    booking.customerPhone,
    booking.id,
  );

  const selectedIso = localIsoDate(booking.startsAt, business.timezone);
  const todayIso = localIsoDate(new Date(), business.timezone);

  return (
    <>
      <PageHeader title="Booking" backHref="/dashboard/calendar" />
      <CustomerCard booking={booking} noShowCount={noShowCount} />
      <BookingMeta
        booking={booking}
        timeZone={business.timezone}
        currency={business.currency}
        todayIso={todayIso}
        selectedIso={selectedIso}
      />
      {booking.notes ? (
        <SectionCard title="Notes" className="mt-3">
          <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5] text-text">
            {booking.notes}
          </p>
        </SectionCard>
      ) : null}
      <BookingActions booking={booking} />
    </>
  );
}
