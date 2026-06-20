"use client";

import type { AvailabilityResponse } from "@/lib/booking/types";
import type { CreateBookingInput } from "@/lib/schemas/booking";
import { PUBLIC_AVAILABILITY_WINDOW_DAYS } from "@/lib/booking/constants";
import {
  createBookingAction,
  type CreateBookingActionResult,
} from "@/app/(public)/book/actions";

// The booking data layer's I/O — the ONLY place the availability route and the
// booking server actions are called. Hooks (use-availability / use-create-booking)
// call these; components call the hooks. (cancelBooking lands here with the
// manage page.)

export interface FetchAvailabilityParams {
  businessId: string;
  serviceIds: string[]; // execution order — NOT sorted
  resourceId?: string; // concrete id; omit for the union ("any")
}

export async function fetchAvailability(
  params: FetchAvailabilityParams,
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

export function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingActionResult> {
  return createBookingAction(input);
}
