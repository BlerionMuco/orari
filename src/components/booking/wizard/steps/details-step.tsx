"use client";

import * as React from "react";
import { useBookingWizard } from "../booking-wizard-store";
import {
  GuestDetailsFields,
  type GuestDetailsValue,
} from "../ui/guest-details-fields";
import { StepShell } from "../ui/step-shell";

export function DetailsStep(): React.JSX.Element {
  const businessName = useBookingWizard((s) => s.business.name);
  const guest = useBookingWizard((s) => s.guest);
  const errors = useBookingWizard((s) => s.errors);
  const setGuest = useBookingWizard((s) => s.setGuest);
  const setErrors = useBookingWizard((s) => s.setErrors);

  // Clear a field's error as the user edits it.
  function onChange(patch: Partial<GuestDetailsValue>): void {
    setGuest(patch);
    if ("name" in patch && errors.name) setErrors({ ...errors, name: undefined });
    if ("phone" in patch && errors.phone) {
      setErrors({ ...errors, phone: undefined });
    }
    if ("email" in patch && errors.email) {
      setErrors({ ...errors, email: undefined });
    }
  }

  return (
    <StepShell
      title="Your details"
      subtitle={`So ${businessName} can confirm your appointment.`}
    >
      <GuestDetailsFields value={guest} errors={errors} onChange={onChange} />
    </StepShell>
  );
}
