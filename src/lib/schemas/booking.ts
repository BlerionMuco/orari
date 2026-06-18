import { z } from "zod";

export const CreateBookingInput = z.object({
  businessId: z.string().uuid(),
  // Optional: present = book this specific resource; omitted = "Any available"
  // (the server assigns a concrete free resource). The action branches on it.
  resourceId: z.string().uuid().optional(),
  serviceId: z.string().uuid(),
  startsAt: z.coerce.date(),
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(3).max(40),
  customerEmail: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
  // De-dupes double-submits / retries; the client sends one stable value per
  // booking attempt. Backed by a unique index on bookings.idempotency_key.
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingInput>;

export const CancelBookingInput = z.object({
  manageToken: z.string().min(1),
});

export type CancelBookingInput = z.infer<typeof CancelBookingInput>;
