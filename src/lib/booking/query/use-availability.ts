"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { AvailabilitySlot, AvailabilityResponse } from "@/lib/booking/types";
import { addDaysToIsoDate } from "@/lib/booking/time";
import { RESOURCE_ANY } from "@/lib/booking/constants";
import { QUERY_KEYS } from "@/lib/query/keys";
import { fetchAvailability, type FetchAvailabilityParams } from "./api";
import type {
  AvailabilityDay,
  AvailabilityParams,
  UseAvailabilityResult,
} from "./types";

// Real availability: ONE windowed fetch of /api/public/availability for the
// selected basket (+ resource, or the union for "any"), from which both the day
// strip and the per-day slots are derived. Slots are available-only; a day with
// zero slots renders as closed. The DATE WINDOW is server-owned (invariant 3) —
// we send a day COUNT, never dates, and build the strip from the response's
// rangeStartDate/rangeEndDate.

export interface AvailabilityQueryConfig {
  queryKey: string[];
  queryFn: () => Promise<AvailabilityResponse>;
  staleTime: number;
}

// Shared query config so the time-step read and the barber-step prefetch use the
// EXACT same key — the prefetch is then a cache hit when the time step mounts.
export function availabilityQueryOptions(
  params: FetchAvailabilityParams,
): AvailabilityQueryConfig {
  return {
    queryKey: [
      QUERY_KEYS.AVAILABILITY,
      params.businessId,
      params.resourceId ?? RESOURCE_ANY,
      params.serviceIds.join(","),
    ],
    queryFn: () => fetchAvailability(params),
    staleTime: 30_000,
  };
}

function enumerateDays(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  for (let d = startIso; d <= endIso; d = addDaysToIsoDate(d, 1)) out.push(d);
  return out;
}

export function useAvailability(
  params: AvailabilityParams,
): UseAvailabilityResult {
  const { businessId, serviceIds, resourceId, dayIso, queryOptions } = params;

  const query = useQuery({
    ...availabilityQueryOptions({ businessId, serviceIds, resourceId }),
    enabled: serviceIds.length > 0,
    // Re-check on every (re)entry to the time step and on tab refocus, so a
    // returning user sees current availability without a manual page refresh.
    // (The barber-step prefetch still paints instantly; this refetches behind it.)
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    ...queryOptions,
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

  // Days are derived from the response window — they exist only once data has
  // loaded (no client date math, no closed-flag flicker on refetch).
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
