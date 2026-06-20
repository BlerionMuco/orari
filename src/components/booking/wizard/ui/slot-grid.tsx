"use client";

import * as React from "react";
import { ArrowRight, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/form/radio-group";

export interface SlotView {
  startUtc: string | null; // null = a placeholder/taken slot (mock only)
  label: string; // "09:30"
  disabled: boolean;
}

export interface SlotGroupView {
  title: string; // "Morning"
  openCount: number;
  slots: SlotView[];
}

export interface EmptyDayInfo {
  dayName: string;
  nextLabel: string | null;
  onJumpNext: () => void;
}

export interface SlotGridProps {
  loading: boolean;
  groups: SlotGroupView[];
  selected: string | null; // selected slot startUtc
  onPick: (startUtc: string) => void;
  empty: EmptyDayInfo | null;
}

const chipClass =
  "flex h-11.5 touch-manipulation select-none items-center justify-center gap-1.25 rounded-[12px] border border-border bg-surface text-[15px] font-medium tabular-nums text-text transition-[transform,background-color,border-color,color] hover:border-border-strong active:scale-[0.94] data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-surface data-[state=checked]:shadow-[0_8px_18px_-8px_rgba(91,95,199,0.55)]";

function Skeleton(): React.JSX.Element {
  return (
    <div>
      <div className="mb-3.25 h-2.75 w-18.5 rounded-[5px] bg-fill-subtle" />
      <div className="mb-5 grid grid-cols-3 gap-2.25 lg:grid-cols-5 lg:gap-2.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-11.5 animate-pulse rounded-[12px] bg-fill-subtle" />
        ))}
      </div>
    </div>
  );
}

export function SlotGrid({
  loading,
  groups,
  selected,
  onPick,
  empty,
}: SlotGridProps): React.JSX.Element {
  if (loading) return <Skeleton />;

  if (groups.length === 0 && empty) {
    return (
      <div className="rounded-[16px] border border-border bg-surface px-3 pb-7.5 pt-8.5 text-center">
        <div className="mx-auto mb-3.75 flex h-13.5 w-13.5 items-center justify-center rounded-[15px] bg-fill-subtle">
          <Calendar className="h-6.5 w-6.5 text-text-muted" strokeWidth={1.7} />
        </div>
        <h3 className="text-[17px] font-semibold text-text">
          No times available on this day
        </h3>
        <p className="mt-1.25 text-[13.5px] leading-[1.5] text-text-muted">
          {empty.dayName} is fully booked.
        </p>
        {empty.nextLabel ? (
          <Button
            variant="outline"
            onClick={empty.onJumpNext}
            className="mt-4.5 h-11 gap-1.75 rounded-[12px] border-primary text-primary hover:border-primary hover:bg-primary-tint"
          >
            Jump to {empty.nextLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <RadioGroup
      value={selected ?? ""}
      onValueChange={onPick}
      aria-label="Choose a time"
    >
      {groups.map((group) => (
        <div key={group.title} className="mb-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
              {group.title}
            </span>
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-text-disabled">
              {group.openCount} open
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.25 lg:grid-cols-5 lg:gap-2.5">
            {group.slots.map((slot, i) => {
              // Taken / placeholder slots (no startUtc) aren't selectable.
              if (!slot.startUtc || slot.disabled) {
                return (
                  <span
                    key={slot.startUtc ?? `${group.title}-${i}`}
                    className="flex h-11.5 items-center justify-center rounded-[12px] border border-border bg-fill-subtle text-[15px] font-medium tabular-nums text-text-disabled line-through"
                  >
                    {slot.label}
                  </span>
                );
              }
              const isSelected = slot.startUtc === selected;
              return (
                <RadioGroupItem
                  key={slot.startUtc}
                  value={slot.startUtc}
                  className={chipClass}
                >
                  {isSelected ? (
                    <Check className="h-3.25 w-3.25" strokeWidth={2.7} />
                  ) : null}
                  <span>{slot.label}</span>
                </RadioGroupItem>
              );
            })}
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
