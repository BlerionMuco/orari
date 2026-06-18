import { describe, it, expect } from "vitest";
import { formatAddress, mapsHref } from "../location";
import type { Location } from "@/lib/schemas/business";

const full: Location = {
  line1: "Rruga Myslym Shyri 21",
  city: "Tirana",
  countryCode: "AL",
  latitude: 41.3275,
  longitude: 19.8187,
};

describe("formatAddress", () => {
  it("returns null when there is no location", () => {
    expect(formatAddress(null)).toBeNull();
    expect(formatAddress(undefined)).toBeNull();
  });

  it("prefers a provider-formatted address when present", () => {
    expect(
      formatAddress({ ...full, formattedAddress: "21 Myslym Shyri, Tirana" }),
    ).toBe("21 Myslym Shyri, Tirana");
  });

  it("composes structured parts when no formatted address", () => {
    expect(
      formatAddress({
        line1: "Rruga A",
        line2: "Kati 2",
        city: "Tirana",
        region: "Tiranë",
        postalCode: "1001",
        countryCode: "AL",
      }),
    ).toBe("Rruga A, Kati 2, Tirana, Tiranë, 1001");
  });
});

describe("mapsHref", () => {
  it("returns null when there is no location", () => {
    expect(mapsHref(null)).toBeNull();
  });

  it("prefers coordinates", () => {
    expect(mapsHref(full)).toBe(
      "https://www.google.com/maps/search/?api=1&query=41.3275,19.8187",
    );
  });

  it("falls back to the encoded address when no coordinates", () => {
    expect(
      mapsHref({ line1: "Rruga A", city: "Tirana", countryCode: "AL" }),
    ).toBe(
      "https://www.google.com/maps/search/?api=1&query=Rruga%20A%2C%20Tirana",
    );
  });
});
