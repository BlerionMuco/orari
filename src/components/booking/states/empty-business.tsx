import * as React from "react";
import { Phone, Info } from "lucide-react";
import type { PublicBusiness } from "@/lib/booking/public-dto";
import { Button } from "@/components/ui/buttons/button";

export interface EmptyBusinessProps {
  business: PublicBusiness;
}

// Business exists but has no active services to book online.
export function EmptyBusiness({
  business,
}: EmptyBusinessProps): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-115 rounded-[20px] border border-border bg-surface p-10 text-center shadow-card">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[15px] bg-fill-subtle">
        <Info className="h-7 w-7 text-text-muted" strokeWidth={1.7} />
      </div>
      <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-text">
        Not taking online bookings
      </h2>
      <p className="mx-auto mt-2.5 max-w-75 text-[14px] leading-[1.55] text-text-muted">
        {business.name} isn&apos;t taking online bookings right now.
        {business.phone ? " Give them a call to book directly." : ""}
      </p>
      {business.phone ? (
        <Button
          asChild
          size="lg"
          className="mt-6 shadow-[0_8px_20px_-8px_rgba(91,95,199,0.5)]"
        >
          <a href={`tel:${business.phone}`}>
            <Phone className="h-4.25 w-4.25" strokeWidth={2} />
            Call {business.phone}
          </a>
        </Button>
      ) : null}
    </div>
  );
}
