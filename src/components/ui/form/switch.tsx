"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

// Radix Switch — track 44×26, knob 20. On = brand indigo, off = strong border.
// Used for day open/closed and owner-bookable.
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "inline-flex h-6.5 w-11 flex-none cursor-pointer items-center rounded-full p-0.5 transition-colors",
        "bg-border-strong data-[state=checked]:bg-primary",
        "focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block h-5 w-5 rounded-full bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.22)] transition-transform data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  );
});
