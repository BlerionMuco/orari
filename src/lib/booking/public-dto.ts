// Public-safe read DTOs for the anonymous booking surface. Pure types only
// (client-importable, no server-only deps). Invariant 4: no raw DB row crosses
// to the client — queries.ts projects rows into these and instants serialize to
// ISO strings.

import type { Location } from "@/lib/schemas/business";
import type { Vertical } from "@/lib/business/labels";

export interface PublicBusiness {
  id: string;
  slug: string;
  name: string;
  vertical: Vertical;
  timezone: string; // IANA
  currency: string; // ISO-4217
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  location: Location | null;
}

export interface PublicService {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number; // minor units
}

export interface PublicResource {
  id: string;
  name: string;
}

export type PublicBookingStatus =
  | "held"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface PublicBookingView {
  id: string;
  status: PublicBookingStatus;
  startsAt: string; // ISO
  endsAt: string; // ISO
  customerName: string;
  notes: string | null;
}

// Everything the manage page needs: the booking, its assigned resource, the
// service, and a slim business projection (slug verifies the manage link;
// timezone/currency render the summary).
export interface PublicManageView {
  business: {
    slug: string;
    name: string;
    timezone: string;
    currency: string;
  };
  service: PublicService;
  resource: PublicResource;
  booking: PublicBookingView;
}
