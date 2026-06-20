"use client";

import * as React from "react";
import { Step } from "@/lib/booking/steps";
import { BookingFailureCode } from "@/lib/booking/booking-codes";
import { useCreateBooking } from "@/lib/booking/query";
import {
  useBookingWizard,
  WizardStatus,
  RESOURCE_ANY,
} from "./booking-wizard-store";

// Wizard glue over the generic useCreateBooking mutation: reads the store, fires
// the mutation, and maps the result onto wizard state. On success → "booked" +
// result; on a slot taken under us → drop the slot + bounce to the time step
// (availability is refetched by the mutation's onSettled invalidate); otherwise
// → "idle" with a submitError. An in-flight ref + status guard prevent
// double-submits (the server idempotency key is the real backstop).
export function useConfirmBooking(): { confirm: () => void } {
  const businessId = useBookingWizard((s) => s.business.id);
  const serviceIds = useBookingWizard((s) => s.serviceIds);
  const resourceChoice = useBookingWizard((s) => s.resourceId);
  const slot = useBookingWizard((s) => s.slot);
  const guest = useBookingWizard((s) => s.guest);
  const idempotencyKey = useBookingWizard((s) => s.idempotencyKey);
  const status = useBookingWizard((s) => s.status);
  const setStatus = useBookingWizard((s) => s.setStatus);
  const setResult = useBookingWizard((s) => s.setResult);
  const setSubmitError = useBookingWizard((s) => s.setSubmitError);
  const setSlot = useBookingWizard((s) => s.setSlot);
  const setStepIndex = useBookingWizard((s) => s.setStepIndex);
  const steps = useBookingWizard((s) => s.steps);

  const inFlight = React.useRef(false);

  const { mutate } = useCreateBooking({
    onSuccess: (res) => {
      if (res.booking) {
        setResult({
          manageToken: res.booking.manageToken,
          confirmationCode: `#${res.booking.manageToken
            .slice(0, 4)
            .toUpperCase()}`,
          resourceName: res.booking.resource.name,
        });
        setStatus(WizardStatus.BOOKED);
      } else if (res.code === BookingFailureCode.SLOT_TAKEN) {
        // Taken under us: drop the stale slot + bounce to the time step to
        // re-pick. setSlot clears submitError, so set the message AFTER it.
        setStatus(WizardStatus.IDLE);
        setSlot(null);
        const timeIdx = steps.indexOf(Step.TIME);
        if (timeIdx >= 0) setStepIndex(timeIdx);
        setSubmitError(res.error ?? "That time was just taken — pick another.");
      } else {
        setStatus(WizardStatus.IDLE);
        setSubmitError(
          res.error ?? "Could not complete your booking. Please try again.",
        );
      }
    },
    onError: () => {
      setStatus(WizardStatus.IDLE);
      setSubmitError("Could not complete your booking. Please try again.");
    },
  });

  const confirm = React.useCallback(() => {
    if (inFlight.current || status === WizardStatus.CONFIRMING) return;
    if (!slot || serviceIds.length === 0) return;

    inFlight.current = true;
    setSubmitError(null);
    setStatus(WizardStatus.CONFIRMING);

    // "any"/null → let the server assign (omit resourceId); a concrete id books
    // that specific resource.
    const resourceId =
      resourceChoice && resourceChoice !== RESOURCE_ANY
        ? resourceChoice
        : undefined;

    mutate(
      {
        businessId,
        resourceId,
        serviceIds,
        startsAt: new Date(slot.startUtc),
        customerName: guest.name,
        customerPhone: guest.phone,
        customerEmail: guest.email.trim() ? guest.email.trim() : undefined,
        notes: guest.note ? guest.note : undefined,
        idempotencyKey: idempotencyKey ?? undefined,
      },
      {
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  }, [
    businessId,
    serviceIds,
    resourceChoice,
    slot,
    guest,
    idempotencyKey,
    status,
    setStatus,
    setSubmitError,
    mutate,
  ]);

  return { confirm };
}
