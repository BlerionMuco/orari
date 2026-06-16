import { inngest } from "../client";
import {
  loadUnprocessedOutbox,
  markOutboxProcessed,
} from "@/lib/booking/queries";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

// Drains the transactional outbox: side effects written inside a booking's
// transaction are dispatched here, post-commit, so a rollback can't orphan them.
// Each `booking_confirmed` row re-emits `booking/confirmed` (which schedules the
// reminder) and is then marked processed.
export const drainOutbox = inngest.createFunction(
  {
    id: "drain-outbox",
    triggers: [{ cron: "* * * * *" }],
  },
  async ({ step }) => {
    const rows = await step.run("load-unprocessed", () =>
      loadUnprocessedOutbox(100),
    );
    for (const row of rows) {
      if (row.type === "booking_confirmed") {
        await step.sendEvent(`emit-${row.id}`, {
          name: "booking/confirmed",
          data: asRecord(row.payload),
        });
      }
      await step.run(`mark-${row.id}`, () => markOutboxProcessed(row.id));
    }
    return { processed: rows.length };
  },
);
