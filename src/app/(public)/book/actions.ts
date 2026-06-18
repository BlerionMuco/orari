"use server";

import { CreateBookingInput, CancelBookingInput } from "@/lib/schemas/booking";
import {
  createBooking,
  type CreateBookingFailureCode,
} from "@/lib/booking/create-booking";
import { createAnyBooking } from "@/lib/booking/create-any-booking";
import {
  cancelBooking,
  type CancelBookingFailureCode,
} from "@/lib/booking/cancel-booking";

export interface CreateBookingActionResult {
  error?: string;
  // The failure code is passed through (not just the message) so the wizard can
  // branch — e.g. bounce back to the time step on "slot-taken".
  code?: CreateBookingFailureCode;
  booking?: {
    id: string;
    manageToken: string;
    startsAt: string;
    endsAt: string;
    // The assigned resource — for "Any available" this is the server's choice;
    // the confirmation names the barber.
    resource: { id: string; name: string };
  };
}

export async function createBookingAction(
  input: unknown,
): Promise<CreateBookingActionResult> {
  const parsed = CreateBookingInput.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check your details and try again." };
  }

  // Specific resource → createBooking; "Any available" (no resourceId) →
  // createAnyBooking (server-side assignment).
  const result = parsed.data.resourceId
    ? await createBooking(parsed.data)
    : await createAnyBooking(parsed.data);

  if (!result.ok) return { error: result.error, code: result.code };

  return {
    booking: {
      id: result.bookingId,
      manageToken: result.manageToken,
      startsAt: result.startsAt.toISOString(),
      endsAt: result.endsAt.toISOString(),
      resource: result.resource,
    },
  };
}

export interface CancelBookingActionResult {
  error?: string;
  code?: CancelBookingFailureCode;
  status?: "cancelled" | "already-cancelled";
}

export async function cancelBookingAction(
  input: unknown,
): Promise<CancelBookingActionResult> {
  const parsed = CancelBookingInput.safeParse(input);
  if (!parsed.success) {
    return { error: "This link is no longer valid." };
  }

  const result = await cancelBooking(parsed.data.manageToken);
  if (!result.ok) return { error: result.error, code: result.code };
  return { status: result.status };
}
