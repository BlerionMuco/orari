import { inngest } from "./client";

export const releaseHeldSlot = inngest.createFunction(
  {
    id: "release-held-slot",
    triggers: [{ event: "booking/slot.held" }],
  },
  async ({ event, step }) => {
    await step.sleep("hold-ttl", "10m");
    // TODO: release slot if not converted to a booking
    return { ok: true, holdId: event.data.holdId };
  },
);

export const sendBookingReminder = inngest.createFunction(
  {
    id: "send-booking-reminder",
    triggers: [{ event: "booking/confirmed" }],
  },
  async ({ event, step }) => {
    const remindAt = new Date(event.data.startsAt);
    remindAt.setHours(remindAt.getHours() - 24);
    await step.sleepUntil("t-minus-24h", remindAt);
    // TODO: send reminder email/SMS
    return { ok: true, bookingId: event.data.bookingId };
  },
);

export const functions = [releaseHeldSlot, sendBookingReminder];
