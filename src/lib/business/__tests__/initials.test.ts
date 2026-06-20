import { describe, it, expect } from "vitest";
import { initials } from "../initials";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Beni's Barber")).toBe("BB");
    expect(initials("john doe smith")).toBe("JD");
  });

  it("returns one letter for a single word", () => {
    expect(initials("Tirana")).toBe("T");
  });

  it("collapses extra whitespace", () => {
    expect(initials("  Tirana   Barber  ")).toBe("TB");
  });

  it("returns empty for empty / whitespace-only input", () => {
    expect(initials("")).toBe("");
    expect(initials("   ")).toBe("");
  });

  it("skips non-letter leading characters", () => {
    expect(initials("@home studio")).toBe("HS");
    expect(initials("123 Main")).toBe("M");
  });

  it("uppercases the result", () => {
    expect(initials("café lulu")).toBe("CL");
  });
});
