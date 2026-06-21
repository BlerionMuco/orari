"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBookingWizard, RESOURCE_ANY } from "../booking-wizard-store";
import { availabilityQueryOptions } from "@/lib/booking/query";
import {
  BarberPicker,
  BarberOptionKind,
  type BarberOption,
} from "../ui/barber-picker";
import { StepShell } from "@/components/ui/wizard/step-shell";

export function BarberStep(): React.JSX.Element {
  const businessId = useBookingWizard((s) => s.business.id);
  const serviceIds = useBookingWizard((s) => s.serviceIds);
  const resources = useBookingWizard((s) => s.resources);
  const resourceId = useBookingWizard((s) => s.resourceId);
  const setResource = useBookingWizard((s) => s.setResource);
  const queryClient = useQueryClient();

  // Warm the time step's availability while the user picks a barber: prefetch the
  // union on land (resourceId null/"any" → undefined), and the specific barber's
  // calendar once chosen — so the matching cache key is already populated when
  // the time step mounts. Idempotent + respects staleTime (won't double-fetch).
  React.useEffect(() => {
    if (serviceIds.length === 0) return;
    const prefetchResourceId =
      resourceId && resourceId !== RESOURCE_ANY ? resourceId : undefined;
    void queryClient.prefetchQuery(
      availabilityQueryOptions({
        businessId,
        serviceIds,
        resourceId: prefetchResourceId,
      }),
    );
  }, [queryClient, businessId, serviceIds, resourceId]);

  // Lead with "Any available" (maps to createAnyBooking), then each barber.
  const barbers: BarberOption[] = [
    {
      id: RESOURCE_ANY,
      name: "Any available",
      role: "Soonest free barber",
      kind: BarberOptionKind.ANY,
    },
    ...resources.map((r) => ({
      id: r.id,
      name: r.name,
      kind: BarberOptionKind.PERSON,
    })),
  ];

  return (
    <StepShell
      title="Choose your barber"
      subtitle="Pick who you'd like, or let us choose."
    >
      <BarberPicker
        barbers={barbers}
        selectedId={resourceId}
        onSelect={setResource}
      />
    </StepShell>
  );
}
