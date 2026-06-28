"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { services } from "@/db/schema";
import { businessScope } from "@/lib/db/scoped";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { ServiceFormInput } from "@/lib/schemas/service";
import { isPgError } from "@/lib/booking/pg-errors";

const CreatePayload = ServiceFormInput;
const UpdatePayload = ServiceFormInput.extend({ id: z.string().uuid() });
const ActivePayload = z.object({ id: z.string().uuid(), active: z.boolean() });
const IdPayload = z.object({ id: z.string().uuid() });

export interface ServiceActionResult {
  ok: boolean;
  error?: string;
  serviceId?: string;
}

// Owner-gated context. Returns the tenant scope + role; the dashboard caller
// pages already redirect staff to /restricted, so staff reaching here is a
// belt-and-braces server-side guard, not a UX path.
async function ownerContext(): Promise<
  { ok: true; scope: ReturnType<typeof businessScope> } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, error: "No business." };
  if (business.role !== "owner") return { ok: false, error: "Only the owner can edit services." };
  return { ok: true, scope: businessScope(business.id) };
}

function invalidate(): void {
  revalidatePath("/dashboard/settings/services");
  revalidatePath("/dashboard/new-booking");
  revalidatePath("/dashboard");
}

export async function createServiceAction(
  input: z.infer<typeof CreatePayload>,
): Promise<ServiceActionResult> {
  const parsed = CreatePayload.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form fields." };

  const ctx = await ownerContext();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const [row] = await db
    .insert(services)
    .values({
      businessId: ctx.scope.businessId,
      name: parsed.data.name.trim(),
      durationMin: parsed.data.durationMin,
      priceCents: parsed.data.price,
      beforeBufferMin: parsed.data.beforeBufferMin,
      afterBufferMin: parsed.data.afterBufferMin,
      active: parsed.data.active,
    })
    .returning({ id: services.id });

  invalidate();
  return { ok: true, serviceId: row.id };
}

export async function updateServiceAction(
  input: z.infer<typeof UpdatePayload>,
): Promise<ServiceActionResult> {
  const parsed = UpdatePayload.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form fields." };

  const ctx = await ownerContext();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const updated = await db
    .update(services)
    .set({
      name: parsed.data.name.trim(),
      durationMin: parsed.data.durationMin,
      priceCents: parsed.data.price,
      beforeBufferMin: parsed.data.beforeBufferMin,
      afterBufferMin: parsed.data.afterBufferMin,
      active: parsed.data.active,
    })
    .where(ctx.scope.where("services", eq(services.id, parsed.data.id)))
    .returning({ id: services.id });

  if (updated.length === 0) return { ok: false, error: "Service not found." };

  invalidate();
  return { ok: true, serviceId: updated[0].id };
}

export async function setServiceActiveAction(
  input: z.infer<typeof ActivePayload>,
): Promise<ServiceActionResult> {
  const parsed = ActivePayload.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad input." };

  const ctx = await ownerContext();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const updated = await db
    .update(services)
    .set({ active: parsed.data.active })
    .where(ctx.scope.where("services", eq(services.id, parsed.data.id)))
    .returning({ id: services.id });

  if (updated.length === 0) return { ok: false, error: "Service not found." };

  invalidate();
  return { ok: true, serviceId: updated[0].id };
}

// Delete is FK-restricted by `bookings.service_id` / `booking_services.service_id`
// (both onDelete: 'restrict'). When a service has past bookings, the DB raises
// 23503 — we map it to a friendly hint so the operator deactivates instead.
export async function deleteServiceAction(
  input: z.infer<typeof IdPayload>,
): Promise<ServiceActionResult> {
  const parsed = IdPayload.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad input." };

  const ctx = await ownerContext();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  try {
    const deleted = await db
      .delete(services)
      .where(ctx.scope.where("services", eq(services.id, parsed.data.id)))
      .returning({ id: services.id });
    if (deleted.length === 0) return { ok: false, error: "Service not found." };
    invalidate();
    return { ok: true };
  } catch (e) {
    if (isPgError(e) && e.code === "23503") {
      return {
        ok: false,
        error:
          "This service has past bookings. Deactivate it instead so the records keep their history.",
      };
    }
    throw e;
  }
}
