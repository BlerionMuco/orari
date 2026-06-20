"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { initials } from "@/lib/business/initials";
import {
  RadioGroup,
  RadioGroupItem,
  RadioCircle,
} from "@/components/ui/form/radio-group";
import { optionCardClass, OptionCardBody } from "./option-card-body";

// Presentational discriminant: "any" shows the star icon, "person" the initials.
export const BarberOptionKind = {
  ANY: "any",
  PERSON: "person",
} as const;
export type BarberOptionKind =
  (typeof BarberOptionKind)[keyof typeof BarberOptionKind];

export interface BarberOption {
  id: string; // a resource id, or RESOURCE_ANY
  name: string;
  role?: string;
  kind: BarberOptionKind;
}

export interface BarberPickerProps {
  barbers: BarberOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Avatar fills indigo when its card is checked (driven by the RadioGroupItem's
// `group` + `data-state`).
function Avatar({ option }: { option: BarberOption }): React.JSX.Element {
  return (
    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-fill-subtle text-[16px] font-semibold text-text-muted transition-colors group-data-[state=checked]:bg-primary group-data-[state=checked]:text-surface">
      {option.kind === BarberOptionKind.ANY ? (
        <Star className="h-5 w-5" strokeWidth={1.9} />
      ) : (
        (initials(option.name) || option.name.charAt(0).toUpperCase())
      )}
    </span>
  );
}

// Single-select barber list (Radix radio cards), led by "Any available".
export function BarberPicker({
  barbers,
  selectedId,
  onSelect,
}: BarberPickerProps): React.JSX.Element {
  return (
    <RadioGroup
      value={selectedId ?? ""}
      onValueChange={onSelect}
      aria-label="Choose your barber"
      className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3"
    >
      {barbers.map((barber) => (
        <RadioGroupItem key={barber.id} value={barber.id} className={optionCardClass}>
          <OptionCardBody
            leading={<Avatar option={barber} />}
            title={barber.name}
            subtitle={barber.role}
          />
          <RadioCircle />
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}
