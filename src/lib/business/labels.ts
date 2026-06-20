// Display labels for business domain enums. Pure, client-importable.
// The canonical vertical→label map already lives in the onboarding schema
// (it drives the onboarding select); re-exported here so business surfaces have
// one import home and the map stays a single source of truth (no drift).

import { VERTICAL_LABELS, VERTICALS } from "@/lib/schemas/onboarding";

export type Vertical = (typeof VERTICALS)[number];

// Named access to the verticals (use Vertical.BARBER instead of a bare "barber").
// `satisfies` keeps values valid; the parity test enforces exhaustiveness vs the
// pgEnum / VERTICALS source.
export const Vertical = {
  BARBER: "barber",
  CLINIC: "clinic",
  TUTOR: "tutor",
  SPA: "spa",
  FITNESS: "fitness",
  OTHER: "other",
} as const satisfies Record<string, Vertical>;

export { VERTICAL_LABELS };

// Total over the enum — every vertical has a label, so no fallback is needed.
export function verticalLabel(vertical: Vertical): string {
  return VERTICAL_LABELS[vertical];
}
