import { describe, it, expect } from "vitest";
import { normalizePhone } from "../phone";

describe("normalizePhone", () => {
  it("converts an Albanian national leading-0 number to E.164", () => {
    // The locked acceptance case.
    expect(normalizePhone("0691234567", "AL")).toEqual({
      e164: "+355691234567",
      valid: true,
    });
  });

  it("strips formatting (spaces, dashes, parens) before normalizing", () => {
    expect(normalizePhone("069 123 4567", "AL").e164).toBe("+355691234567");
    expect(normalizePhone("(069) 123-4567", "AL").e164).toBe("+355691234567");
  });

  it("passes through an already-E.164 number", () => {
    expect(normalizePhone("+355691234567", "AL")).toEqual({
      e164: "+355691234567",
      valid: true,
    });
  });

  it("treats a 00 international prefix as +", () => {
    expect(normalizePhone("00355691234567", "AL").e164).toBe("+355691234567");
  });

  it("uses the business country's dial code for national input", () => {
    expect(normalizePhone("0441234567", "GR").e164).toBe("+30441234567");
    expect(normalizePhone("01711234567", "GB").e164).toBe("+441711234567");
  });

  it("falls back to AL for an unknown default country", () => {
    expect(normalizePhone("0691234567", "ZZ").e164).toBe("+355691234567");
  });

  it("flags junk as invalid without throwing", () => {
    expect(normalizePhone("abc", "AL").valid).toBe(false);
    expect(normalizePhone("", "AL").valid).toBe(false);
    expect(normalizePhone("123", "AL").valid).toBe(false);
  });
});
