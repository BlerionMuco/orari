"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

// Radix radio-group: roving tabindex, arrow-key navigation, and radio ARIA come
// for free. `RadioGroupItem` is a styleable button (card / pill / chip) — pass
// `value`, `disabled`, `className`; style the selected state with
// `data-[state=checked]:…`. It carries `group` so trailing indicators can read
// the checked state via `group-data-[state=checked]:…`.

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Root ref={ref} className={className} {...props} />
  );
});

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(function RadioGroupItem({ className, children, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "group cursor-pointer focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Item>
  );
});

// A trailing radio dot — place inside a RadioGroupItem. Fills indigo and shows a
// white dot when its item is checked.
export function RadioCircle(): React.JSX.Element {
  return (
    <span className="flex h-5.5 w-5.5 flex-none items-center justify-center rounded-full border-2 border-border-strong transition-colors group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary">
      <RadioGroupPrimitive.Indicator className="flex">
        <span className="h-2 w-2 rounded-full bg-surface" />
      </RadioGroupPrimitive.Indicator>
    </span>
  );
}
