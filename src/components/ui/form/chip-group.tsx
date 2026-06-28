"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/form/radio-group";

export interface ChipOption {
  value: string;
  label: string;
  caption?: string;
  disabled?: boolean;
}

export interface SingleChipGroupProps {
  multi?: false;
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<ChipOption>;
  ariaLabel: string;
  className?: string;
}

export interface MultiChipGroupProps {
  multi: true;
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: ReadonlyArray<ChipOption>;
  ariaLabel: string;
  className?: string;
}

export type ChipGroupProps = SingleChipGroupProps | MultiChipGroupProps;

const chipClass =
  "inline-flex h-10 flex-none items-center gap-2 rounded-[11px] border px-3.5 text-[13.5px] font-semibold transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus";

// Pill picker — single via Radix RadioGroup, multi via toggle buttons.
// Used for service basket (multi), resource picker (single), day quick filters.
export function ChipGroup(props: ChipGroupProps): React.JSX.Element {
  if (props.multi) {
    return <MultiChipGroup {...props} />;
  }
  return <SingleChipGroup {...props} />;
}

function SingleChipGroup({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: SingleChipGroupProps): React.JSX.Element {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((opt) => (
        <RadioGroupItem
          key={opt.value}
          value={opt.value}
          disabled={opt.disabled}
          className={cn(
            chipClass,
            "border-border bg-surface text-text",
            "hover:border-border-strong",
            "data-[state=checked]:border-primary data-[state=checked]:bg-primary-tint data-[state=checked]:text-primary-pressed",
            opt.disabled && "opacity-60",
          )}
        >
          <span>{opt.label}</span>
          {opt.caption ? (
            <span className="text-[12px] font-normal text-text-muted group-data-[state=checked]:text-primary-pressed/80">
              {opt.caption}
            </span>
          ) : null}
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}

function MultiChipGroup({
  values,
  onValuesChange,
  options,
  ariaLabel,
  className,
}: MultiChipGroupProps): React.JSX.Element {
  const toggle = (value: string): void => {
    onValuesChange(
      values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
    );
  };
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((opt) => {
        const on = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            aria-pressed={on}
            onClick={() => toggle(opt.value)}
            className={cn(
              chipClass,
              on
                ? "border-primary bg-primary-tint text-primary-pressed"
                : "border-border bg-surface text-text hover:border-border-strong",
              opt.disabled && "opacity-60",
            )}
          >
            <span>{opt.label}</span>
            {opt.caption ? (
              <span
                className={cn(
                  "text-[12px] font-normal",
                  on ? "text-primary-pressed/80" : "text-text-muted",
                )}
              >
                {opt.caption}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
