import { describe, it, expect } from "vitest";
import { buildSteps } from "../steps";

describe("buildSteps", () => {
  it("omits the resource step for 0 or 1 resource", () => {
    const expected = ["service", "time", "details", "confirmation"];
    expect(buildSteps(0)).toEqual(expected);
    expect(buildSteps(1)).toEqual(expected);
  });

  it("includes the resource step for more than one resource", () => {
    const expected = ["service", "resource", "time", "details", "confirmation"];
    expect(buildSteps(2)).toEqual(expected);
    expect(buildSteps(5)).toEqual(expected);
  });
});
