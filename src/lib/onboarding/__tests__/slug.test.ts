import { describe, it, expect } from "vitest";
import { slugify, isReservedSlug, isValidSlugFormat } from "../slug";

describe("slugify", () => {
  it("folds Albanian diacritics to ASCII", () => {
    expect(slugify("Berberi Çela")).toBe("berberi-cela");
    expect(slugify("Sallon Ëndrra")).toBe("sallon-endrra");
    const both = slugify("Çç Ëë");
    expect(both).toBe("cc-ee");
    expect(isValidSlugFormat(both)).toBe(true);
  });

  it("collapses non-alphanumerics and trims hyphens", () => {
    expect(slugify("  Beni  Barber!! ")).toBe("beni-barber");
    expect(slugify("A & B")).toBe("a-b");
  });

  it("falls back to 'shop' when nothing survives", () => {
    expect(slugify("!!!")).toBe("shop");
    expect(slugify("")).toBe("shop");
  });

  it("caps at 40 chars with no trailing hyphen", () => {
    const out = slugify("x".repeat(60));
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.endsWith("-")).toBe(false);
  });
});

describe("isValidSlugFormat", () => {
  it("accepts 3–40 lowercase, digits and single hyphens", () => {
    expect(isValidSlugFormat("abc")).toBe(true);
    expect(isValidSlugFormat("a-b-c")).toBe(true);
    expect(isValidSlugFormat("beni-barber-2")).toBe(true);
  });

  it("rejects bad shapes", () => {
    expect(isValidSlugFormat("ab")).toBe(false); // too short
    expect(isValidSlugFormat("x".repeat(41))).toBe(false); // too long
    expect(isValidSlugFormat("-abc")).toBe(false);
    expect(isValidSlugFormat("abc-")).toBe(false);
    expect(isValidSlugFormat("a--b")).toBe(false);
    expect(isValidSlugFormat("Abc")).toBe(false); // uppercase
    expect(isValidSlugFormat("a_b")).toBe(false);
  });
});

describe("isReservedSlug", () => {
  it("flags reserved words and route segments", () => {
    expect(isReservedSlug("book")).toBe(true);
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("sign-in")).toBe(true);
    expect(isReservedSlug("dashboard")).toBe(true);
  });

  it("allows ordinary slugs", () => {
    expect(isReservedSlug("beni-barber")).toBe(false);
    expect(isReservedSlug("tirana-cuts")).toBe(false);
  });
});
