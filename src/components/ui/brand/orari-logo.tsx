import * as React from "react";
import { ClockIcon } from "@/components/ui/icons/clock-icon";
import { cn } from "@/lib/utils";

export interface OrariLogoProps {
  className?: string;
}

export function OrariLogo({ className }: OrariLogoProps): React.JSX.Element {
  return (
    <div className={cn("inline-flex items-center gap-2.25", className)}>
      <span className="flex h-7.5 w-7.5 items-center justify-center rounded-[9px] bg-primary text-surface">
        <ClockIcon className="h-4.25 w-4.25" />
      </span>
      <span className="text-[21px] font-semibold leading-none tracking-[-0.01em] text-text">
        orari
      </span>
    </div>
  );
}
