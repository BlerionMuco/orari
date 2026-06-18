// Pure presentation helpers for a business `Location`. No DB, no IO,
// client-importable. Both return null when there's nothing to show, so callers
// render the address block / directions link only when meaningful.

import type { Location } from "@/lib/schemas/business";

function nonEmpty(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

// A single human-readable line. Prefers the provider-formatted address; else
// composes the structured parts.
export function formatAddress(
  location: Location | null | undefined,
): string | null {
  if (!location) return null;
  if (nonEmpty(location.formattedAddress)) return location.formattedAddress;

  const parts = [
    location.line1,
    location.line2,
    location.city,
    location.region,
    location.postalCode,
  ].filter(nonEmpty);

  return parts.length > 0 ? parts.join(", ") : null;
}

// A Google Maps universal link. Prefers exact coordinates; else the formatted
// address. Null when neither is available.
export function mapsHref(
  location: Location | null | undefined,
): string | null {
  if (!location) return null;

  const base = "https://www.google.com/maps/search/?api=1&query=";
  if (location.latitude != null && location.longitude != null) {
    return `${base}${location.latitude},${location.longitude}`;
  }

  const address = formatAddress(location);
  return address ? `${base}${encodeURIComponent(address)}` : null;
}
