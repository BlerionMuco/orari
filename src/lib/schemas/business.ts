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

// Dashboard "Business profile" form. Slug format is checked here; uniqueness
// is enforced at the DB level + re-checked in the server action. Logo is a
// URL (paste from Supabase Storage for V1; file-upload flow is a follow-up)
// and is host-validated by `isAllowedLogoHost` at the action boundary.
export const BusinessProfileFormInput = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  slug: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, hyphens."),
  phone: z.string().max(40).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url("Enter a full https URL.").optional().or(z.literal("")),
  currency: z.string().regex(/^[A-Z]{3}$/, "ISO 4217 currency code (e.g. ALL, EUR)."),
  location: LocationSchema.nullable().optional(),
});
export type BusinessProfileFormInput = z.infer<typeof BusinessProfileFormInput>;
