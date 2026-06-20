"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Step } from "@/lib/booking/steps";
import { BookingFailureCode } from "@/lib/booking/booking-codes";
import { createBookingAction } from "@/app/(public)/book/actions";
import {
  useBookingWizard,
  WizardStatus,
  RESOURCE_ANY,
} from "./booking-wizard-store";

// Real submit: calls the createBookingAction server action with the full basket
// and maps the result onto the store. On success → status "booked" + result; on
// failure → back to "idle" with a submitError shown on Review (e.g. a slot taken
// in the meantime). Server-side idempotency (the rotated key) makes a double
// Confirm safe; an in-flight ref guards against concurrent calls too.
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
  const queryClient = useQueryClient();

  const inFlight = React.useRef(false);

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

    void createBookingAction({
      businessId,
      resourceId,
      serviceIds,
      startsAt: slot.startUtc,
      customerName: guest.name,
      customerPhone: guest.phone,
      notes: guest.note ? guest.note : undefined,
      idempotencyKey: idempotencyKey ?? undefined,
    })
      .then((res) => {
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
          // Taken out from under us: drop the stale selection, refresh
          // availability, and bounce to the time step to re-pick. setSlot clears
          // submitError, so set the message AFTER it.
          setStatus(WizardStatus.IDLE);
          setSlot(null);
          void queryClient.invalidateQueries({ queryKey: ["availability"] });
          const timeIdx = steps.indexOf(Step.TIME);
          if (timeIdx >= 0) setStepIndex(timeIdx);
          setSubmitError(
            res.error ?? "That time was just taken — pick another.",
          );
        } else {
          setStatus(WizardStatus.IDLE);
          setSubmitError(
            res.error ?? "Could not complete your booking. Please try again.",
          );
        }
      })
      .catch(() => {
        setStatus(WizardStatus.IDLE);
        setSubmitError("Could not complete your booking. Please try again.");
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [
    businessId,
    serviceIds,
    resourceChoice,
    slot,
    guest,
    idempotencyKey,
    status,
    setStatus,
    setResult,
    setSubmitError,
    setSlot,
    setStepIndex,
    steps,
    queryClient,
  ]);

  return { confirm };
}
