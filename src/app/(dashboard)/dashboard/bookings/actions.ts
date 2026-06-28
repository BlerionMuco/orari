"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import { markBookingComplete } from "@/lib/booking/mark-complete";
import { markBookingNoShow } from "@/lib/booking/mark-no-show";
import { cancelBookingScoped } from "@/lib/booking/cancel-booking-scoped";

const bookingIdSchema = z.object({ bookingId: z.string().uuid() });

export interface BookingActionResult {
  ok: boolean;
  error?: string;
}

async function withScope(): Promise<{
  scope: ReturnType<typeof businessScope>;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const business = await getCurrentBusiness(user.id);
  if (!business) return null;
  return { scope: businessScope(business.id) };
}

// Status transitions. Server actions return a flat result; the client section
// shows a toast + navigates on success. revalidatePath refreshes any cached
// dashboard page so the new status surfaces immediately.

export async function markBookingCompleteAction(
  input: z.infer<typeof bookingIdSchema>,
): Promise<BookingActionResult> {
  const parsed = bookingIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad input." };

  const ctx = await withScope();
  if (!ctx) return { ok: false, error: "Not signed in." };

  const res = await markBookingComplete(
    ctx.scope,
    parsed.data.bookingId,
    new Date(),
  );
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath(`/dashboard/bookings/${parsed.data.bookingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}

export async function markBookingNoShowAction(
  input: z.infer<typeof bookingIdSchema>,
): Promise<BookingActionResult> {
  const parsed = bookingIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad input." };

  const ctx = await withScope();
  if (!ctx) return { ok: false, error: "Not signed in." };

  const res = await markBookingNoShow(
    ctx.scope,
    parsed.data.bookingId,
    new Date(),
  );
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath(`/dashboard/bookings/${parsed.data.bookingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}

export async function cancelBookingAction(
  input: z.infer<typeof bookingIdSchema>,
): Promise<BookingActionResult> {
  const parsed = bookingIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad input." };

  const ctx = await withScope();
  if (!ctx) return { ok: false, error: "Not signed in." };

  const res = await cancelBookingScoped(ctx.scope, parsed.data.bookingId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath(`/dashboard/bookings/${parsed.data.bookingId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}
