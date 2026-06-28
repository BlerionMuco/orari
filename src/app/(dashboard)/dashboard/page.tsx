import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import { getResourceForUser, listDayBookings } from "@/lib/booking/queries";
import { localIsoDate } from "@/lib/booking/time";
import { BookingStatus } from "@/db/schema";
import { Button } from "@/components/ui/buttons/button";
import { ScreenState } from "@/components/ui/feedback/screen-state";
import { HomeGreeting } from "@/components/dashboard/home/home-greeting";
import { NextBookingCard } from "@/components/dashboard/home/next-booking-card";
import { LaterTodayList } from "@/components/dashboard/home/later-today-list";

// Layout already gated user + business, so the bangs here are safe and the
// types stay precise without a redundant null check.
export default async function HomePage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  const scope = businessScope(business.id);
  const todayIso = localIsoDate(new Date(), business.timezone);

  // Staff: scope every list to their resource. Owner: see all.
  let resourceId: string | undefined;
  if (business.role === "staff") {
    const ownResource = await getResourceForUser(scope, user.id);
    resourceId = ownResource?.id;
  }

  const todays = await listDayBookings(scope, todayIso, business.timezone, resourceId);
  const live = todays.filter((b) => b.status === BookingStatus.CONFIRMED);
  const nextBooking = live[0] ?? null;
  const later = live.slice(1);
  const meta = user.user_metadata ?? {};
  const fullName = typeof meta.name === "string" ? meta.name : null;
  const firstName = fullName ? fullName.split(" ")[0] : null;

  return (
    <>
      <HomeGreeting firstName={firstName} bookingsToday={todays.length} />
      {nextBooking ? (
        <NextBookingCard booking={nextBooking} timeZone={business.timezone} />
      ) : (
        <div className="rounded-[18px] border border-border bg-surface">
          <ScreenState
            kind="empty"
            icon="calendar"
            title="No bookings today"
            body="When customers book, they show up here automatically."
            action={
              <Button asChild>
                <Link href="/dashboard/new-booking">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add booking
                </Link>
              </Button>
            }
          />
        </div>
      )}
      <LaterTodayList bookings={later} timeZone={business.timezone} />
    </>
  );
}
