import { z } from "zod";

export const CreateBookingInput = z.object({
  businessId: z.string().uuid(),
  resourceId: z.string().uuid(),
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
