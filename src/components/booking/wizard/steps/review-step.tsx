"use client";

import * as React from "react";
import { useBookingWizard } from "../booking-wizard-store";
import { useBookingSummary } from "../use-booking-summary";
import { ReviewSummary } from "../ui/review-summary";
import { StepShell } from "../ui/step-shell";

export function ReviewStep(): React.JSX.Element {
  const { rows, priceLabel } = useBookingSummary();
  const businessName = useBookingWizard((s) => s.business.name);
  const submitError = useBookingWizard((s) => s.submitError);

  return (
    <StepShell
      title="Review & confirm"
      subtitle="Check everything looks right before you book."
    >
      <ReviewSummary rows={rows} tone="surface" />
      {submitError ? (
        <p
          role="alert"
          className="mx-0.5 mt-3.5 rounded-[11px] border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-[13px] leading-[1.45] text-danger-text"
        >
          {submitError}
        </p>
      ) : null}
      <p className="mx-0.5 mt-3.5 text-center text-[12.5px] leading-[1.5] text-text-muted">
        You&apos;ll pay {priceLabel} in person at {businessName}.
      </p>
    </StepShell>
  );
}
