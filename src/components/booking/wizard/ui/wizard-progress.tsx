import * as React from "react";
import { cn } from "@/lib/utils";

export interface WizardProgressProps {
  current: number; // 1-based
  total: number;
  stepName: string;
}

// Segmented progress bar + "Step X of N" + the current step's name. Segments
// up to `current` fill indigo with a spring-ish width transition.
export function WizardProgress({
  current,
  total,
  stepName,
}: WizardProgressProps): React.JSX.Element {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[12px] font-semibold text-text">
          Step {current} of {total}
        </span>
        <span className="text-[12px] font-medium text-text-muted">
          {stepName}
        </span>
      </div>
      <div className="flex gap-[5px]">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="h-1 flex-1 overflow-hidden rounded-full bg-border"
          >
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.34,1.4,0.5,1)]",
                i < current ? "w-full" : "w-0",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
