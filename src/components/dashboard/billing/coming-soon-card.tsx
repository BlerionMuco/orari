import * as React from "react";
import { SectionCard } from "@/components/ui/display/section-card";
import { Button } from "@/components/ui/buttons/button";

// Placeholder for the paid plan upgrade flow. Provider (Paddle / Lemon
// Squeezy) lands after V1, so the CTA is intentionally disabled — visible
// so the operator knows the surface is coming.
export function ComingSoonCard(): React.JSX.Element {
  return (
    <SectionCard
      title="Paid plans"
      description="Upgrade flow is coming soon. You'll keep your data and settings."
    >
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-text-muted">
          Once paid plans launch, you&apos;ll be able to upgrade directly from
          this page. We&apos;ll email every owner before the trial period ends.
        </p>
        <div>
          <Button variant="primary" size="md" disabled>
            Upgrade (coming soon)
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
