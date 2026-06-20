import * as React from "react";
import { MapPin, Phone } from "lucide-react";
import type { PublicBusiness } from "@/lib/booking/public-dto";
import { verticalLabel } from "@/lib/business/labels";
import { formatAddress, mapsHref } from "@/lib/business/location";
import { Button } from "@/components/ui/buttons/button";
import { BusinessLogo } from "./business-logo";

export interface BusinessCardProps {
  business: PublicBusiness;
}

// Business profile card. Responsive: on mobile the contact actions are a pill
// row (compact "Call" + directions); on desktop they stack as full-width rows
// (full phone number). One instance serves both the mobile header and the
// desktop rail (single tree — no duplicate DOM).
export function BusinessCard({
  business,
}: BusinessCardProps): React.JSX.Element {
  const address = formatAddress(business.location);
  const directions = mapsHref(business.location);
  const subline = [verticalLabel(business.vertical), business.location?.city]
    .filter(Boolean)
    .join(" · ");
  const addressShort = business.location?.line1 ?? address;

  return (
    <div className="rounded-[16px] border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start gap-3.5">
        <BusinessLogo logoUrl={business.logoUrl} name={business.name} size="md" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-semibold leading-tight tracking-[-0.015em] text-text">
            {business.name}
          </h1>
          <p className="mt-0.75 text-[12.5px] text-text-muted">{subline}</p>
        </div>
      </div>

      {business.description ? (
        <p className="mt-3 text-[13px] leading-[1.5] text-text-muted">
          {business.description}
        </p>
      ) : null}

      {business.phone || directions ? (
        <div className="mt-3.5 flex items-center gap-2.25 lg:flex-col lg:items-stretch">
          {business.phone ? (
            <Button
              asChild
              variant="outline"
              className="h-10.5 gap-2.25 rounded-[12px] bg-bg px-3.5 text-[13px] font-medium"
            >
              <a href={`tel:${business.phone}`}>
                <Phone className="h-3.75 w-3.75 flex-none text-primary" strokeWidth={2} />
                <span className="lg:hidden">Call</span>
                <span className="hidden lg:inline">{business.phone}</span>
              </a>
            </Button>
          ) : null}
          {directions ? (
            <Button
              asChild
              variant="outline"
              className="h-10.5 min-w-0 flex-1 justify-start gap-2.25 rounded-[12px] bg-bg px-3.5 text-[13px] font-medium lg:flex-none"
            >
              <a href={directions} target="_blank" rel="noreferrer noopener">
                <MapPin className="h-3.75 w-3.75 flex-none text-primary" strokeWidth={2} />
                <span className="min-w-0 truncate">{addressShort}</span>
                <span className="ml-auto flex-none font-semibold text-primary">
                  Directions
                </span>
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
