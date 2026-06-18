// Lightweight, dependency-free phone normalization — Albanian-format aware.
// Locals write a national leading-0 number ("069 123 4567"), which a naive E.164
// regex rejects; we convert it to E.164 with the business country's dial code.
// Pure, unit-tested. NOT a replacement for libphonenumber-js (ships later with
// SMS reminders) — just enough to accept real local input and store E.164.

export interface NormalizedPhone {
  e164: string; // best-effort E.164 (may be invalid — check `valid`)
  valid: boolean;
}

// Launch markets only. Extend as we expand; an unknown defaultCountry falls back
// to AL so a missing/odd business country still normalizes local input.
const DIAL_CODES: Record<string, string> = {
  AL: "355", // Albania
  XK: "383", // Kosovo
  MK: "389", // North Macedonia
  ME: "382", // Montenegro
  GR: "30", // Greece
  IT: "39", // Italy
  DE: "49", // Germany
  US: "1",
  GB: "44",
};

// Total digit count 8..15 after the leading "+", first digit non-zero.
const E164 = /^\+[1-9]\d{7,14}$/;

export function normalizePhone(
  raw: string,
  defaultCountry: string = "AL",
): NormalizedPhone {
  const trimmed = (raw ?? "").trim();

  let e164: string;
  if (trimmed.startsWith("+")) {
    // Already international.
    e164 = `+${trimmed.slice(1).replace(/\D/g, "")}`;
  } else {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.startsWith("00")) {
      // "00" trunk → international prefix.
      e164 = `+${digits.slice(2)}`;
    } else {
      // National number: drop a single leading-0 trunk prefix, prepend the
      // business country's dial code.
      const national = digits.startsWith("0") ? digits.slice(1) : digits;
      const dial = DIAL_CODES[defaultCountry.toUpperCase()] ?? DIAL_CODES.AL;
      e164 = `+${dial}${national}`;
    }
  }

  return { e164, valid: E164.test(e164) };
}
