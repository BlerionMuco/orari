"use server";

import { CreateBookingInput } from "@/lib/schemas/booking";
import { createBooking } from "@/lib/booking/create-booking";

export interface CreateBookingActionResult {
  error?: string;
  booking?: {
    id: string;
    manageToken: string;
    startsAt: string;
    endsAt: string;
  };
}

export async function createBookingAction(
  input: unknown,
): Promise<CreateBookingActionResult> {
  const parsed = CreateBookingInput.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check your details and try again." };
  }

  const result = await createBooking(parsed.data);
  if (!result.ok) return { error: result.error };

  return {
    booking: {
      id: result.bookingId,
      manageToken: result.manageToken,
      startsAt: result.startsAt.toISOString(),
      endsAt: result.endsAt.toISOString(),
    },
  };
}
