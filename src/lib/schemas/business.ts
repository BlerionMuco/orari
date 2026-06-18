import { z } from "zod";

// One typed place per business (V1). Stored as a single `jsonb` column on
// `businesses` via Drizzle `$type<Location>()` and re-validated with this schema
// whenever it crosses a trust boundary (DTO read, profile write). V1 use is
// display + a directions link — not address search; revisit (→ a `locations`
// table) if multiple addresses or geocoded search ever appear. `timezone` is NOT
// duplicated here — it stays its own `businesses` column because the engine
// reads it.
//
// Every field is optional at the object level, but when a location object exists
// the human-meaningful anchors (`line1`, `city`, `countryCode`) are required —
// a half-empty address is worse than none. The whole column stays nullable.
export const LocationSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  region: z.string().max(120).optional(),
  postalCode: z.string().max(20).optional(),
  // ISO-3166-1 alpha-2, upper-case (drives `normalizePhone`'s default country).
  countryCode: z.string().regex(/^[A-Z]{2}$/, "Use a 2-letter country code."),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  // A provider-formatted single-line address, preferred for display when set.
  formattedAddress: z.string().max(500).optional(),
  // Opaque map-provider id, kept for a future "open in maps" deep link.
  placeId: z.string().max(300).optional(),
  // Free-text help ("ring the bell", "2nd floor") shown under the address.
  directionsNote: z.string().max(500).optional(),
});

export type Location = z.infer<typeof LocationSchema>;
