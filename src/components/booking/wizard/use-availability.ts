"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  AvailabilitySlot,
  AvailabilityResponse,
} from "@/lib/booking/types";
import { addDaysToIsoDate } from "@/lib/booking/time";
import { PUBLIC_AVAILABILITY_WINDOW_DAYS } from "@/lib/booking/constants";
import { useBookingWizard, RESOURCE_ANY } from "./booking-wizard-store";

// Real availability: ONE windowed fetch of /api/public/availability for the
// selected basket (+ resource, or the union for "any"), from which both the day
// strip and the per-day slots are derived. Slots are available-only (taken ones
// are omitted by the engine); a day with zero slots renders as closed/"No times".
//
// The basket order is preserved in the query (it drives the block's buffers) and
// is part of the query key, so changing the basket refetches. The DATE WINDOW is
// server-owned (invariant 3): we send a day COUNT, never dates, and build the
// strip from `rangeStartDate`/`rangeEndDate` in the response.

export interface AvailabilityDay {
  iso: string;
  closed: boolean; // no bookable slots in the window for this day
  // The windowed API can't distinguish "shop closed" from "fully booked", so
  // `full` is always false here — kept only for the DayStrip prop contract.
  full: boolean;
}

export interface UseAvailabilityResult {
  days: AvailabilityDay[];
  todayIso: string | null; // server-owned range start; day labels key off it
  loading: boolean;
  slots: AvailabilitySlot[];
}

interface FetchParams {
  businessId: string;
  serviceIds: string[]; // execution order — NOT sorted
  resourceId: string | undefined; // concrete id, or undefined for the union
}

async function fetchAvailability(
  params: FetchParams,
): Promise<AvailabilityResponse> {
  const qs = new URLSearchParams();
  qs.set("businessId", params.businessId);
  qs.set("serviceIds", params.serviceIds.join(","));
  if (params.resourceId) qs.set("resourceId", params.resourceId);
  // Day COUNT, not dates — the server anchors the window to its own "today".
  qs.set("days", String(PUBLIC_AVAILABILITY_WINDOW_DAYS));

  const res = await fetch(`/api/public/availability?${qs.toString()}`);
  if (!res.ok) throw new Error(`availability_failed_${res.status}`);
  return (await res.json()) as AvailabilityResponse;
}

function enumerateDays(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  for (let d = startIso; d <= endIso; d = addDaysToIsoDate(d, 1)) out.push(d);
  return out;
}

export interface AvailabilityQuery {
  queryKey: string[];
  queryFn: () => Promise<AvailabilityResponse>;
  staleTime: number;
}

// Shared query config so the time-step hook and the barber-step prefetch use the
// EXACT same key — a prefetch on the barber step is then a cache hit when the
// time step mounts. `resourceId` undefined = the union ("Any available").
export function availabilityQueryOptions(
  params: FetchParams,
): AvailabilityQuery {
  return {
    queryKey: [
      "availability",
      params.businessId,
      params.resourceId ?? RESOURCE_ANY,
      params.serviceIds.join(","),
    ],
    queryFn: () => fetchAvailability(params),
    staleTime: 30_000,
  };
}

export function useAvailability(dayIso: string | null): UseAvailabilityResult {
  const businessId = useBookingWizard((s) => s.business.id);
  const serviceIds = useBookingWizard((s) => s.serviceIds);
  const resourceChoice = useBookingWizard((s) => s.resourceId);

  // "any"/null → union (omit resourceId); a concrete id → that resource.
  const resourceId =
    resourceChoice && resourceChoice !== RESOURCE_ANY
      ? resourceChoice
      : undefined;

  const query = useQuery({
    ...availabilityQueryOptions({ businessId, serviceIds, resourceId }),
    enabled: serviceIds.length > 0,
  });

  const slotsByDay = React.useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const slot of query.data?.slots ?? []) {
      const arr = map.get(slot.isoDate);
      if (arr) arr.push(slot);
      else map.set(slot.isoDate, [slot]);
    }
    return map;
  }, [query.data]);

  // Days are derived from the response window — so they only exist once data has
  // loaded (no client-side date guesswork, and no closed-flag flicker on refetch
  // since they aren't synthesized before/independently of the data).
  const days: AvailabilityDay[] = React.useMemo(() => {
    const data = query.data;
    if (!data) return [];
    return enumerateDays(data.rangeStartDate, data.rangeEndDate).map((iso) => ({
      iso,
      closed: (slotsByDay.get(iso)?.length ?? 0) === 0,
      full: false,
    }));
  }, [query.data, slotsByDay]);

  const slots = dayIso ? (slotsByDay.get(dayIso) ?? []) : [];
  const loading = serviceIds.length > 0 && query.isPending;
  const todayIso = query.data?.rangeStartDate ?? null;

  return { days, todayIso, loading, slots };
}
