"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatAddress, mapsHref } from "@/lib/business/location";
import { buildIcsHref } from "@/lib/booking/ics";
import { Step } from "@/lib/booking/steps";
import { BusinessCard } from "../business-card";
import {
  useBookingWizard,
  WizardStatus,
  type WizardErrors,
} from "./booking-wizard-store";
import { useBookingSummary } from "./use-booking-summary";
import { useConfirmBooking } from "./use-confirm-booking";
import { BookingWizardLayout } from "./booking-wizard-layout";
import { LiveSummary } from "./live-summary";
import { WizardProgress } from "@/components/ui/wizard/wizard-progress";
import { WizardNav } from "@/components/ui/wizard/wizard-nav";
import { SuccessPanel } from "./ui/success-panel";
import type { SummaryRow } from "./ui/review-summary";
import { ServiceStep } from "./steps/service-step";
import { BarberStep } from "./steps/barber-step";
import { TimeStep } from "./steps/time-step";
import { DetailsStep } from "./steps/details-step";
import { ReviewStep } from "./steps/review-step";

const STEP_NAMES: Record<Step, string> = {
  [Step.SERVICE]: "Choose service",
  [Step.RESOURCE]: "Choose barber",
  [Step.TIME]: "Pick a time",
  [Step.DETAILS]: "Your details",
  [Step.CONFIRMATION]: "Confirm",
};

function renderStep(step: Step): React.JSX.Element {
  switch (step) {
    case Step.SERVICE:
      return <ServiceStep />;
    case Step.RESOURCE:
      return <BarberStep />;
    case Step.TIME:
      return <TimeStep />;
    case Step.DETAILS:
      return <DetailsStep />;
    case Step.CONFIRMATION:
      return <ReviewStep />;
  }
}

function validateGuest(
  name: string,
  phone: string,
  email: string,
): WizardErrors {
  const errors: WizardErrors = {};
  if (name.trim().length < 2) errors.name = "Please enter your name.";
  if ((phone.match(/\d/g) ?? []).length < 8) {
    errors.phone = "Enter a valid phone number.";
  }
  // Email is optional — validate only when provided.
  const trimmedEmail = email.trim();
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = "Enter a valid email.";
  }
  return errors;
}

export function BookingWizard(): React.JSX.Element {
  const reduce = useReducedMotion();
  const business = useBookingWizard((s) => s.business);
  const steps = useBookingWizard((s) => s.steps);
  const stepIndex = useBookingWizard((s) => s.stepIndex);
  const status = useBookingWizard((s) => s.status);
  const serviceIds = useBookingWizard((s) => s.serviceIds);
  const resourceId = useBookingWizard((s) => s.resourceId);
  const slot = useBookingWizard((s) => s.slot);
  const guest = useBookingWizard((s) => s.guest);
  const result = useBookingWizard((s) => s.result);
  const setStepIndex = useBookingWizard((s) => s.setStepIndex);
  const setErrors = useBookingWizard((s) => s.setErrors);
  const reset = useBookingWizard((s) => s.reset);

  const summary = useBookingSummary();
  const { confirm } = useConfirmBooking();

  const step = steps[stepIndex];
  const isStepWithNext =
    step === Step.SERVICE || step === Step.RESOURCE || step === Step.TIME;

  // Details is valid only when name + phone pass (same rules as the submit
  // guard) — so the "Review booking" button stays disabled until then.
  const detailsErrors = validateGuest(guest.name, guest.phone, guest.email);
  const detailsValid =
    !detailsErrors.name && !detailsErrors.phone && !detailsErrors.email;

  const canContinue =
    step === Step.SERVICE
      ? serviceIds.length > 0
      : step === Step.RESOURCE
        ? resourceId !== null
        : step === Step.TIME
          ? slot !== null
          : step === Step.DETAILS
            ? detailsValid
            : true; // confirmation

  const busy = status === WizardStatus.CONFIRMING;
  const primaryLabel =
    step === Step.CONFIRMATION
      ? busy
        ? "Booking…"
        : "Confirm booking"
      : step === Step.DETAILS
        ? "Review booking"
        : "Continue";

  // Slide direction for the step transition, set by the nav handlers (forward =
  // 1, back = -1) — not read from a ref during render.
  const [direction, setDirection] = React.useState(1);
  const offset = reduce ? 0 : 22;

  function goForward(): void {
    setDirection(1);
    setStepIndex(stepIndex + 1);
  }

  function onPrimary(): void {
    if (isStepWithNext) {
      if (canContinue) goForward();
      return;
    }
    if (step === Step.DETAILS) {
      const errors = validateGuest(guest.name, guest.phone, guest.email);
      if (errors.name || errors.phone || errors.email) setErrors(errors);
      else goForward();
      return;
    }
    confirm(); // confirmation step
  }

  function onBack(): void {
    if (busy) return;
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex(stepIndex - 1);
    }
  }

  // --- Success view ---
  if (status === WizardStatus.BOOKED && result) {
    const successRows: SummaryRow[] = [
      { label: "Service", value: summary.serviceList },
      { label: "Barber", value: result.resourceName },
      { label: "When", value: summary.when },
      { label: "Price", value: summary.priceLabel, emphasis: true },
    ];
    const icsHref = slot
      ? buildIcsHref({
          title: `${summary.serviceList} at ${business.name}`,
          location: formatAddress(business.location) ?? business.name,
          startUtc: slot.startUtc,
          endUtc: slot.endUtc,
        })
      : "#";
    return (
      <SuccessPanel
        businessName={business.name}
        confirmationCode={result.confirmationCode}
        rows={successRows}
        directionsHref={mapsHref(business.location)}
        icsHref={icsHref}
        onBookAnother={reset}
      />
    );
  }

  // --- Flow view ---
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:block">
      <BookingWizardLayout
        businessCard={<BusinessCard business={business} />}
        railSummary={<LiveSummary />}
        progress={
          <WizardProgress
            current={stepIndex + 1}
            total={steps.length}
            stepName={STEP_NAMES[step]}
          />
        }
        nav={
          <WizardNav
            showBack={stepIndex > 0 && !busy}
            onBack={onBack}
            onPrimary={onPrimary}
            primaryLabel={primaryLabel}
            primaryDisabled={(step !== Step.CONFIRMATION && !canContinue) || busy}
            primaryBusy={busy}
            primaryArrow={isStepWithNext && canContinue}
          />
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * offset }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderStep(step)}
          </motion.div>
        </AnimatePresence>
      </BookingWizardLayout>
    </div>
  );
}
