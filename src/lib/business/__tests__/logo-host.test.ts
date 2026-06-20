import { describe, it, expect } from "vitest";
import { isAllowedLogoHost } from "../logo-host";

describe("isAllowedLogoHost", () => {
  it("allows an https Supabase storage subdomain", () => {
    expect(
      isAllowedLogoHost(
        "https://abcd.supabase.co/storage/v1/object/public/logos/x.png",
      ),
    ).toBe(true);
  });

  it("allows sub-subdomains", () => {
    expect(isAllowedLogoHost("https://a.b.supabase.co/x.png")).toBe(true);
  });

  it("rejects the bare apex", () => {
    expect(isAllowedLogoHost("https://supabase.co/x.png")).toBe(false);
  });

  it("rejects look-alike hosts (dot boundary)", () => {
    expect(isAllowedLogoHost("https://evil-supabase.co/x.png")).toBe(false);
  });

  it("rejects unrelated hosts", () => {
    expect(isAllowedLogoHost("https://evil.com/x.png")).toBe(false);
  });

  it("rejects non-https", () => {
    expect(isAllowedLogoHost("http://abcd.supabase.co/x.png")).toBe(false);
  });

  it("returns false (no throw) on malformed input", () => {
    expect(isAllowedLogoHost("")).toBe(false);
    expect(isAllowedLogoHost("not a url")).toBe(false);
  });
});
