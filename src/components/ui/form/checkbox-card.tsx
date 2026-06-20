"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// A whole card that IS a checkbox (Radix Checkbox.Root → role="checkbox",
// Space/Enter toggles). Renders the card body (children) + a trailing check box
// that fills when checked. Style the selected card surface via `className` with
// `data-[state=checked]:…`. Used for independent multi-select (services).
export interface CheckboxCardProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const CheckboxCard = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxCardProps
>(function CheckboxCard({ checked, onCheckedChange, children, className }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className={cn(
        "group cursor-pointer focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus",
        className,
      )}
    >
      {children}
      <span className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[7px] border-2 border-border-strong transition-colors group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary">
        <CheckboxPrimitive.Indicator className="flex text-surface">
          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );
});
