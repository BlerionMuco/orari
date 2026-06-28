"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { groupSlotsByPartOfDay } from "@/lib/booking/slots-view";
import { formatTimezoneLabel } from "@/lib/booking/time";
import { dayLabel } from "@/lib/booking/day-label";
import { useBookingWizard, RESOURCE_ANY } from "../booking-wizard-store";
import { useAvailability } from "@/lib/booking/query";
import { useBookingSummary } from "../use-booking-summary";
import { StepShell } from "@/components/ui/wizard/step-shell";
import { TimeSummaryChip } from "../ui/time-summary-chip";
import { DayStrip, DayStripSkeleton, type DayPill } from "@/components/ui/date/day-strip";
import { SlotGrid, type EmptyDayInfo, type SlotGroupView } from "../ui/slot-grid";

function domOf(iso: string): number {
  return Number(iso.slice(8, 10));
}

function jumpLabel(iso: string, todayIso: string): string {
  const label = dayLabel(iso, todayIso);
  return label === "Today" || label === "Tomorrow"
    ? label
    : `${label} ${domOf(iso)}`;
}

export function TimeStep(): React.JSX.Element {
  const businessId = useBookingWizard((s) => s.business.id);
  const serviceIds = useBookingWizard((s) => s.serviceIds);
  const resourceChoice = useBookingWizard((s) => s.resourceId);
  const timezone = useBookingWizard((s) => s.business.timezone);
  const dayIso = useBookingWizard((s) => s.dayIso);
  const slot = useBookingWizard((s) => s.slot);
  const setDay = useBookingWizard((s) => s.setDay);
  const setSlot = useBookingWizard((s) => s.setSlot);
  const submitError = useBookingWizard((s) => s.submitError);

  // "any"/null → union (omit resourceId); a concrete id → that resource.
  const resourceId =
    resourceChoice && resourceChoice !== RESOURCE_ANY
      ? resourceChoice
      : undefined;
  const { days, todayIso: serverToday, loading, slots } = useAvailability({
    businessId,
    serviceIds,
    resourceId,
    dayIso,
  });
  const { serviceName, durationMeta, totalDuration } = useBookingSummary();

  // Default to the first bookable day once availability loads.
  React.useEffect(() => {
    if (!dayIso && days.length > 0) {
      const first = days.find((d) => !d.closed) ?? days[0];
      setDay(first.iso);
    }
  }, [dayIso, days, setDay]);

  // Server-owned "today" (range start) drives the Today/Tomorrow labels.
  const todayIso = serverToday ?? dayIso ?? "";

  const dayPills: DayPill[] = days.map((d) => ({
    iso: d.iso,
    label: dayLabel(d.iso, todayIso),
    dom: domOf(d.iso),
    disabled: d.closed,
    statusText: d.closed ? "Closed" : d.full ? "Full" : undefined,
  }));

  const groups: SlotGroupView[] = groupSlotsByPartOfDay(slots).map((g) => ({
    title: g.title,
    openCount: g.slots.length,
    slots: g.slots.map((s) => ({
      startUtc: s.startUtc,
      label: s.localTimeLabel,
      disabled: false,
    })),
  }));

  const nextDay = dayIso
    ? (days.find((d) => d.iso > dayIso && !d.closed && !d.full) ?? null)
    : null;
  const empty: EmptyDayInfo | null =
    !loading && groups.length === 0 && dayIso
      ? {
          dayName: dayLabel(dayIso, todayIso),
          nextLabel: nextDay ? jumpLabel(nextDay.iso, todayIso) : null,
          onJumpNext: () => {
            if (nextDay) setDay(nextDay.iso);
          },
        }
      : null;

  function onPickSlot(startUtc: string): void {
    setSlot(slots.find((s) => s.startUtc === startUtc) ?? null);
  }

  return (
    <StepShell title="Choose a time">
      {submitError ? (
        <p
          role="alert"
          className="mb-3.5 rounded-[11px] border border-danger/30 bg-danger-bg px-3.5 py-2.5 text-[13px] leading-[1.45] text-danger-text"
        >
          {submitError}
        </p>
      ) : null}
      <div className="mb-3.5">
        <TimeSummaryChip name={serviceName} meta={durationMeta} />
      </div>
      {loading && days.length === 0 ? (
        <DayStripSkeleton />
      ) : (
        <DayStrip days={dayPills} selectedIso={dayIso} onPick={setDay} />
      )}
      <div className="my-3.5 flex items-center gap-1.75">
        <Clock className="h-3.25 w-3.25 flex-none text-text-muted" strokeWidth={1.8} />
        <span className="text-[12px] text-text-muted">
          {totalDuration > 0 ? totalDuration : 30}-minute appointment ·{" "}
          {formatTimezoneLabel(timezone)}
        </span>
      </div>
      {/* Day strip + meta stay put; only the slots scroll, inside a capped
          height so a long list never blows out the step (mobile) or the card
          (desktop). Negative/positive x-padding keeps chip shadows unclipped. */}
      <div className="max-h-[42vh] min-w-0 overflow-y-auto overscroll-contain lg:max-h-100">
        <SlotGrid
          loading={loading}
          groups={groups}
          selected={slot?.startUtc ?? null}
          onPick={onPickSlot}
          empty={empty}
        />
      </div>
    </StepShell>
  );
}
