import { z } from "zod";

export const CreateBookingInput = z.object({
  businessId: z.string().uuid(),
  // Optional: present = book this specific resource; omitted = "Any available"
  // (the server assigns a concrete free resource). The action branches on it.
  resourceId: z.string().uuid().optional(),
  // The basket, in execution order (order is meaningful — it drives the block's
  // leading/trailing buffers — so it is NEVER sorted). Duplicates are rejected:
  // the same service twice in one booking would double-count duration and trip
  // the unique(booking_id, service_id) constraint. Capped to keep one anonymous
  // request from stacking an unbounded block.
  serviceIds: z
    .array(z.string().uuid())
    .min(1)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Each service can be selected only once.",
    }),
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
