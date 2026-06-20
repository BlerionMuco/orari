import { describe, it, expect } from "vitest";
import { bookingStatusEnum, BookingStatus, verticalEnum } from "@/db/schema";
import { Vertical } from "@/lib/business/labels";
import { VERTICALS } from "@/lib/schemas/onboarding";

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

describe("Vertical", () => {
  it("keeps the pgEnum, VERTICALS, and the named const in sync", () => {
    const verticals = [...VERTICALS].sort();
    expect([...verticalEnum.enumValues].sort()).toEqual(verticals);
    expect(Object.values(Vertical).sort()).toEqual(verticals);
  });
});
