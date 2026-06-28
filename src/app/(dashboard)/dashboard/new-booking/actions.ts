"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { NewBookingFormInput } from "@/lib/schemas/new-booking";
import { createBooking } from "@/lib/booking/create-booking";
import { createAnyBooking } from "@/lib/booking/create-any-booking";
import {
  getAvailableSlots,
  getUnionAvailability,
} from "@/lib/booking/get-available-slots";
import { BookingFailureCode } from "@/lib/booking/booking-codes";
import type { Slot } from "@/lib/booking/types";

export interface ListManualSlotsInput {
  serviceIds: string[];
  resourceId: string | null; // null = "Any available" (union)
  dayIso: string; // business-local YYYY-MM-DD
}

export interface ManualSlot {
  startUtc: string; // ISO
  label: string; // "HH:MM"
}

export interface ListManualSlotsResult {
  ok: boolean;
  slots: ManualSlot[];
  error?: string;
}

function toManualSlot(s: Slot): ManualSlot {
  return { startUtc: s.startUtc.toISOString(), label: s.localTimeLabel };
}

// Owner / staff fetch of bookable slots for a chosen day + basket. Scoped to
// the current business by deriving businessId server-side (the client never
// supplies it, so a forged form can't cross tenants).
export async function listManualSlotsAction(
  input: ListManualSlotsInput,
): Promise<ListManualSlotsResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, slots: [], error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, slots: [], error: "No business." };

  if (input.serviceIds.length === 0 || !input.dayIso) {
    return { ok: true, slots: [] };
  }

  const args = {
    businessId: business.id,
    serviceIds: input.serviceIds,
    rangeStartDate: input.dayIso,
    rangeEndDate: input.dayIso,
  };

  const result = input.resourceId
    ? await getAvailableSlots({ ...args, resourceId: input.resourceId })
    : await getUnionAvailability(args);

  return { ok: true, slots: result.slots.map(toManualSlot) };
}

export interface CreateManualBookingResult {
  ok: boolean;
  error?: string;
  bookingId?: string;
}

// Owner / staff manual booking. The business is derived from the session;
// `createBooking` / `createAnyBooking` validate slot + insert via the same
// engine that powers the public surface, so manual bookings honor the same
// EXCLUDE constraint and outbox flow.
export async function createManualBookingAction(
  input: unknown,
): Promise<CreateManualBookingResult> {
  const parsed = NewBookingFormInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Check the form fields." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, error: "No business." };

  const payload = {
    businessId: business.id,
    resourceId: parsed.data.resourceId ?? undefined,
    serviceIds: parsed.data.serviceIds,
    startsAt: parsed.data.startsAt,
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    customerEmail: parsed.data.customerEmail,
    notes: parsed.data.notes,
  };

  const result = parsed.data.resourceId
    ? await createBooking(payload)
    : await createAnyBooking(payload);

  if (!result.ok) {
    const message =
      result.code === BookingFailureCode.SLOT_TAKEN
        ? "That slot was just taken. Pick another time."
        : result.code === BookingFailureCode.SLOT_UNAVAILABLE
          ? "That time isn't available."
          : result.error;
    return { ok: false, error: message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  return { ok: true, bookingId: result.bookingId };
}
