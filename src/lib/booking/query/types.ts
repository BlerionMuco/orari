import type { UseQueryOptions } from "@tanstack/react-query";
import type {
  AvailabilitySlot,
  AvailabilityResponse,
} from "@/lib/booking/types";
import type { CreateBookingActionResult } from "@/app/(public)/book/actions";

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

// Param-driven read hook input (no store coupling). `queryOptions` lets a caller
// override enabled/staleTime/etc., mirroring the reference doc's pattern.
export interface AvailabilityParams {
  businessId: string;
  serviceIds: string[]; // execution order
  resourceId?: string; // concrete id; omit for the union ("any")
  dayIso: string | null; // selected day to slice slots for
  queryOptions?: Partial<UseQueryOptions<AvailabilityResponse>>;
}

export interface UseCreateBookingArgs {
  onSuccess?: (result: CreateBookingActionResult) => void;
  onError?: (error: unknown) => void;
}
