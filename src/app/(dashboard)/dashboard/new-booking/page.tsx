import * as React from "react";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { resources, services } from "@/db/schema";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import { localIsoDate } from "@/lib/booking/time";
import { formatPrice } from "@/lib/booking/slots-view";
import { Button } from "@/components/ui/buttons/button";
import { PageHeader } from "@/components/ui/nav/page-header";
import { ScreenState } from "@/components/ui/feedback/screen-state";
import {
  ModeTabs,
  NewBookingMode,
} from "@/components/dashboard/new-booking/mode-tabs";
import { BookingForm } from "@/components/dashboard/new-booking/booking-form";
import { BlockForm } from "@/components/dashboard/new-booking/block-form";

interface PageProps {
  searchParams: Promise<{ mode?: string | string[] }>;
}

function pickMode(raw: string | string[] | undefined): NewBookingMode {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === NewBookingMode.BLOCK
    ? NewBookingMode.BLOCK
    : NewBookingMode.BOOKING;
}

export default async function NewBookingPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  const sp = await searchParams;
  const rawMode = pickMode(sp.mode);
  // Staff can only block their own time — server-enforced.
  const isOwner = business.role === "owner";
  const mode = isOwner ? rawMode : NewBookingMode.BLOCK;

  const scope = businessScope(business.id);
  const todayIso = localIsoDate(new Date(), business.timezone);

  // Active resources for both forms; the booking form also needs active services.
  const activeResources = await db
    .select({ id: resources.id, name: resources.name, userId: resources.userId })
    .from(resources)
    .where(scope.where("resources", eq(resources.active, true)))
    .orderBy(asc(resources.name));

  // Staff resource scope: the resource owned by this user (the only one they
  // may block). If they have none, render an empty state instead of an open
  // form that the action would reject anyway.
  const staffResource = isOwner
    ? null
    : activeResources.find((r) => r.userId === user.id) ?? null;

  if (!isOwner && !staffResource) {
    return (
      <>
        <PageHeader title="New" backHref="/dashboard" />
        <ScreenState
          kind="empty"
          title="No resource yet"
          body="Ask the owner to assign you to a resource before blocking time."
        />
      </>
    );
  }

  if (mode === NewBookingMode.BLOCK) {
    const blockResources = isOwner
      ? activeResources.map((r) => ({ id: r.id, label: r.name }))
      : [{ id: staffResource!.id, label: staffResource!.name }];

    return (
      <>
        <PageHeader title="New" backHref="/dashboard" />
        <ModeTabs mode={mode} showBooking={isOwner} />
        <BlockForm
          resources={blockResources}
          allowWholeShop={isOwner}
          todayIso={todayIso}
        />
      </>
    );
  }

  // Booking mode — owner only (staff was redirected to block above).
  const activeServices = await db
    .select({
      id: services.id,
      name: services.name,
      durationMin: services.durationMin,
      priceCents: services.priceCents,
    })
    .from(services)
    .where(scope.where("services", eq(services.active, true)))
    .orderBy(asc(services.name));

  if (activeServices.length === 0) {
    return (
      <>
        <PageHeader title="New" backHref="/dashboard" />
        <ModeTabs mode={mode} showBooking={isOwner} />
        <ScreenState
          kind="empty"
          title="No services yet"
          body="Add a service before creating a booking."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/settings/services/new">Add a service</Link>
            </Button>
          }
        />
      </>
    );
  }

  if (activeResources.length === 0) {
    return (
      <>
        <PageHeader title="New" backHref="/dashboard" />
        <ModeTabs mode={mode} showBooking={isOwner} />
        <ScreenState
          kind="empty"
          title="No active barbers"
          body="Activate at least one team member before creating a booking."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/settings/team">Open team</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="New" backHref="/dashboard" />
      <ModeTabs mode={mode} showBooking={isOwner} />
      <BookingForm
        services={activeServices.map((s) => ({
          id: s.id,
          label: s.name,
          caption: `${s.durationMin}m · ${formatPrice(s.priceCents, business.currency)}`,
        }))}
        resources={activeResources.map((r) => ({ id: r.id, label: r.name }))}
        todayIso={todayIso}
      />
    </>
  );
}

