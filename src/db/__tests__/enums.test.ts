import { describe, it, expect } from "vitest";
import { bookingStatusEnum, BookingStatus } from "@/db/schema";

// The named BookingStatus object must cover EXACTLY the pgEnum's values — the
// `satisfies` constraint keeps values valid, this guards against a missing key
// (drift between the DB enum and the named constant).
describe("BookingStatus", () => {
  it("matches the booking_status pgEnum values", () => {
    expect(Object.values(BookingStatus).sort()).toEqual(
      [...bookingStatusEnum.enumValues].sort(),
    );
  });
});
