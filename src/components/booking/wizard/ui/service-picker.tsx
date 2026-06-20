"use client";

import * as React from "react";
import type { PublicService } from "@/lib/booking/public-dto";
import { formatPrice } from "@/lib/booking/slots-view";
import { CheckboxCard } from "@/components/ui/form/checkbox-card";
import { optionCardClass, OptionCardBody } from "./option-card-body";

export interface ServicePickerProps {
  services: PublicService[];
  currency: string;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

// Multi-select service list (Radix Checkbox cards) + a running total bar.
export function ServicePicker({
  services,
  currency,
  selectedIds,
  onToggle,
}: ServicePickerProps): React.JSX.Element {
  const selected = services.filter((s) => selectedIds.includes(s.id));
  const totalDur = selected.reduce((a, s) => a + s.durationMin, 0);
  const totalPrice = selected.reduce((a, s) => a + s.priceCents, 0);

  return (
    <div>
      <div
        role="group"
        aria-label="Choose one or more services"
        className="grid grid-cols-1 gap-[10px] lg:grid-cols-2 lg:gap-3"
      >
        {services.map((service) => (
          <CheckboxCard
            key={service.id}
            checked={selectedIds.includes(service.id)}
            onCheckedChange={() => onToggle(service.id)}
            className={optionCardClass}
          >
            <OptionCardBody
              title={service.name}
              subtitle={`${service.durationMin} min · ${formatPrice(service.priceCents, currency)}`}
            />
          </CheckboxCard>
        ))}
      </div>

      {selected.length > 0 ? (
        <div className="mt-[13px] flex items-center justify-between rounded-[13px] bg-primary-tint px-[15px] py-[13px]">
          <span className="text-[13px] font-semibold text-primary-pressed">
            {selected.length} {selected.length === 1 ? "service" : "services"}
          </span>
          <span className="text-[13.5px] font-semibold tabular-nums text-primary-pressed">
            {totalDur} min · {formatPrice(totalPrice, currency)}
          </span>
        </div>
      ) : null}
    </div>
  );
}
