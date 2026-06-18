import { describe, it, expect } from "vitest";
import { verticalLabel, VERTICAL_LABELS } from "../labels";
import { VERTICALS } from "@/lib/schemas/onboarding";

describe("verticalLabel", () => {
  it("maps known verticals to friendly labels", () => {
    expect(verticalLabel("barber")).toBe("Barber / Salon");
    expect(verticalLabel("clinic")).toBe("Clinic");
  });

  it("has a label for every vertical enum value (no gaps)", () => {
    for (const v of VERTICALS) {
      expect(VERTICAL_LABELS[v]).toBeTruthy();
    }
  });
});
