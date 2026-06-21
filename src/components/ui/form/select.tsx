"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

// Radix Select with a trigger styled to match `Input` (custom chevron, keyboard
// + ARIA for free). Convenience API: pass an `options` array. Reused for the
// timezone, the service-duration presets, and the half-hour time dropdowns.
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  name,
  disabled,
  error = false,
  className,
  ...aria
}: SelectProps): React.JSX.Element {
  return (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-invalid={error || undefined}
        aria-label={aria["aria-label"]}
        aria-describedby={aria["aria-describedby"]}
        className={cn(
          "flex h-11.5 w-full items-center justify-between gap-2 rounded-[11px] bg-surface px-3.5 text-base text-text",
          "border border-border data-[placeholder]:text-text-disabled",
          "transition-[color,border-color,box-shadow] focus:outline-hidden focus:border-primary focus:ring-[3px] focus:ring-focus",
          "disabled:cursor-not-allowed disabled:bg-fill-subtle disabled:text-text-disabled",
          error && "border-danger focus:border-danger",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 flex-none text-text-muted" aria-hidden="true" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[12px] border border-border bg-surface shadow-card",
          )}
        >
          <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center text-text-muted">
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-[9px] py-2.5 pl-3 pr-8 text-[15px] text-text outline-hidden",
                  "data-[highlighted]:bg-fill-subtle data-[state=checked]:font-medium",
                )}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex">
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center text-text-muted">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
