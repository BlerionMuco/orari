import { describe, it, expect } from "vitest";
import { formatTimezoneLabel } from "../time";

describe("formatTimezoneLabel", () => {
  it("uses the curated city for known zones (never the raw IANA id)", () => {
    expect(formatTimezoneLabel("Europe/Tirane")).toBe("Tirana time");
  });

  it("humanizes the last path segment for other zones", () => {
    expect(formatTimezoneLabel("America/New_York")).toBe("New York time");
    expect(formatTimezoneLabel("Europe/Rome")).toBe("Rome time");
  });
});
