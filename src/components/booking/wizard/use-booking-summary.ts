"use client";

import * as React from "react";
import type { PublicService } from "@/lib/booking/public-dto";
import { formatPrice } from "@/lib/booking/slots-view";
import { localIsoDate } from "@/lib/booking/time";
import { dayLabel } from "@/lib/booking/day-label";
import type { SummaryRow } from "./ui/review-summary";
import { useBookingWizard, RESOURCE_ANY } from "./booking-wizard-store";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface BookingSummary {
  selectedServices: PublicService[];
  serviceName: string; // "Haircut" or "2 services"
  serviceList: string; // "Haircut + Beard"
  totalDuration: number;
  totalPrice: number;
  priceLabel: string; // "2,000 Lek"
  durationMeta: string; // "75 min · 2,000 Lek"
  resourceName: string; // "Any available" / barber / "—"
  when: string; // "Today · Jun 18, 09:30" or "—"
  rows: SummaryRow[];
}

// Derived view-model for everything that summarizes the booking: the time-step
// chip, the desktop rail, the review step, and the success screen. One place,
// so they can't drift.
export function useBookingSummary(): BookingSummary {
  const services = useBookingWizard((s) => s.services);
  const serviceIds = useBookingWizard((s) => s.serviceIds);
  const resources = useBookingWizard((s) => s.resources);
  const resourceId = useBookingWizard((s) => s.resourceId);
  const dayIso = useBookingWizard((s) => s.dayIso);
  const slot = useBookingWizard((s) => s.slot);
  const currency = useBookingWizard((s) => s.business.currency);
  const timezone = useBookingWizard((s) => s.business.timezone);

  return React.useMemo<BookingSummary>(() => {
    const selectedServices = services.filter((s) => serviceIds.includes(s.id));
    const totalDuration = selectedServices.reduce((a, s) => a + s.durationMin, 0);
    const totalPrice = selectedServices.reduce((a, s) => a + s.priceCents, 0);
    const priceLabel = formatPrice(totalPrice, currency);

    const serviceName =
      selectedServices.length === 1
        ? selectedServices[0].name
        : `${selectedServices.length} services`;
    const serviceList =
      selectedServices.map((s) => s.name).join(" + ") || "—";

    const resourceName =
      resourceId === RESOURCE_ANY
        ? "Any available"
        : resourceId
          ? (resources.find((r) => r.id === resourceId)?.name ?? "—")
          : "—";

    let when = "—";
    if (dayIso) {
      const todayIso = localIsoDate(new Date(), timezone);
      const [, month, day] = dayIso.split("-").map(Number);
      const date = `${dayLabel(dayIso, todayIso)} · ${MONTHS[month - 1]} ${day}`;
      when = slot ? `${date}, ${slot.localTimeLabel}` : date;
    }

    const rows: SummaryRow[] = [
      { label: "Service", value: serviceList },
      { label: "Barber", value: resourceName },
      { label: "Date & time", value: when },
      { label: "Duration", value: totalDuration > 0 ? `${totalDuration} minutes` : "—" },
      { label: "Price", value: priceLabel, emphasis: true },
    ];

    return {
      selectedServices,
      serviceName,
      serviceList,
      totalDuration,
      totalPrice,
      priceLabel,
      durationMeta: `${totalDuration} min · ${priceLabel}`,
      resourceName,
      when,
      rows,
    };
  }, [services, serviceIds, resources, resourceId, dayIso, slot, currency, timezone]);
}
