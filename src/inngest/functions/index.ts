// Registry of all Inngest functions, grouped per domain. The /api/inngest route
// serves this `functions` array. Add a new domain file (e.g. `notifications.ts`)
// and include its exports here.
import { releaseHeldSlot, sendBookingReminder } from "./booking";
import { drainOutbox } from "./outbox";

export { releaseHeldSlot, sendBookingReminder, drainOutbox };

export const functions = [releaseHeldSlot, sendBookingReminder, drainOutbox];
