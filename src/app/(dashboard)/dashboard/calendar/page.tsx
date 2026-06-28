import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import {
  getResourceForUser,
  listActiveResources,
  listDayBookings,
} from "@/lib/booking/queries";
import { addDaysToIsoDate, localIsoDate } from "@/lib/booking/time";
import { dayLabel } from "@/lib/booking/day-label";
import { Button } from "@/components/ui/buttons/button";
import { ScreenState } from "@/components/ui/feedback/screen-state";
import { PageHeader } from "@/components/ui/nav/page-header";
import {
  DayFilter,
  RESOURCE_FILTER_ALL,
} from "@/components/dashboard/calendar/day-filter";
import { BookingList } from "@/components/dashboard/calendar/booking-list";
import type { DayPill } from "@/components/ui/date/day-strip";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface CalendarSearchParams {
  date?: string | string[];
  resource?: string | string[];
}

function pickOne(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildDayStrip(todayIso: string): DayPill[] {
  const pills: DayPill[] = [];
  for (let offset = -1; offset <= 5; offset++) {
    const iso = addDaysToIsoDate(todayIso, offset);
    const dom = Number(iso.slice(8, 10));
    pills.push({
      iso,
      label: dayLabel(iso, todayIso),
      dom,
      disabled: false,
    });
  }
  return pills;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<CalendarSearchParams>;
}): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  const scope = businessScope(business.id);

  const todayIso = localIsoDate(new Date(), business.timezone);
  const params = await searchParams;
  const requestedDate = pickOne(params.date);
  const selectedIso = requestedDate && ISO_DATE.test(requestedDate) ? requestedDate : todayIso;

  // Owner: own filter chip. Staff: locked to their resource, no chip.
  const ownerResources =
    business.role === "owner" ? await listActiveResources(business.id) : [];
  const staffResource =
    business.role === "staff" ? await getResourceForUser(scope, user.id) : null;
  const requestedResource = pickOne(params.resource);
  const selectedResource =
    business.role === "staff"
      ? (staffResource?.id ?? RESOURCE_FILTER_ALL)
      : requestedResource && ownerResources.some((r) => r.id === requestedResource)
        ? requestedResource
        : RESOURCE_FILTER_ALL;

  const resourceFilter =
    business.role === "staff"
      ? staffResource?.id
      : selectedResource === RESOURCE_FILTER_ALL
        ? undefined
        : selectedResource;

  const bookings = await listDayBookings(
    scope,
    selectedIso,
    business.timezone,
    resourceFilter,
  );

  const days = buildDayStrip(todayIso);

  return (
    <>
      <PageHeader
        title="Calendar"
        trailing={
          <Button asChild size="sm">
            <Link href="/dashboard/new-booking">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </Link>
          </Button>
        }
      />
      <DayFilter
        todayIso={todayIso}
        selectedIso={selectedIso}
        days={days}
        resourceOptions={
          business.role === "owner"
            ? ownerResources.map((r) => ({ id: r.id, name: r.name }))
            : undefined
        }
        selectedResource={selectedResource}
      />
      {bookings.length === 0 ? (
        <div className="rounded-[18px] border border-border bg-surface">
          <ScreenState
            kind="empty"
            icon="calendar"
            title="No bookings"
            body="Nothing scheduled for this day."
          />
        </div>
      ) : (
        <BookingList
          bookings={bookings}
          timeZone={business.timezone}
          showResource={!resourceFilter}
        />
      )}
    </>
  );
}
