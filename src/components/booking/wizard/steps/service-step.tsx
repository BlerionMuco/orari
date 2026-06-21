"use client";

import * as React from "react";
import { useBookingWizard } from "../booking-wizard-store";
import { ServicePicker } from "../ui/service-picker";
import { StepShell } from "@/components/ui/wizard/step-shell";

export function ServiceStep(): React.JSX.Element {
  const services = useBookingWizard((s) => s.services);
  const currency = useBookingWizard((s) => s.business.currency);
  const serviceIds = useBookingWizard((s) => s.serviceIds);
  const toggleService = useBookingWizard((s) => s.toggleService);

  return (
    <StepShell
      title="Choose a service"
      subtitle="Pick one or more — combine a cut with a beard trim."
    >
      <ServicePicker
        services={services}
        currency={currency}
        selectedIds={serviceIds}
        onToggle={toggleService}
      />
    </StepShell>
  );
}
