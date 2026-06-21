import * as React from "react";
import { Check } from "lucide-react";
import type { Step } from "@/lib/schemas/onboarding";
import { STEP_META } from "./constants";
import { cn } from "@/lib/utils";

export interface ChecklistStepperProps {
  steps: readonly Step[];
  currentIndex: number;
  onGo: (index: number) => void;
}

// Desktop-only left-rail stepper. Completed steps (index < current) are clickable
// to jump back; the current step is highlighted; upcoming steps are inert.
export function ChecklistStepper({
  steps,
  currentIndex,
  onGo,
}: ChecklistStepperProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[18px] border border-border bg-surface p-5 shadow-card">
        <h2 className="text-[15px] font-semibold text-text">
          Set up your business
        </h2>
        <p className="mt-0.5 text-[13px] text-text-muted">
          Five quick steps and you&apos;re bookable.
        </p>

        <ol className="mt-4 flex flex-col gap-1">
          {steps.map((step, i) => {
            const done = i < currentIndex;
            const current = i === currentIndex;
            const meta = STEP_META[step];
            return (
              <li key={step}>
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => onGo(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition-colors",
                    done && "cursor-pointer hover:bg-fill-subtle",
                    current && "bg-primary-tint/60",
                    !done && !current && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6.5 w-6.5 flex-none items-center justify-center rounded-full text-[12px] font-semibold",
                      done && "bg-success text-surface",
                      current && "bg-primary text-surface",
                      !done && !current && "bg-fill-subtle text-text-muted",
                    )}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-[13.5px] font-medium",
                        current ? "text-text" : "text-text-muted",
                      )}
                    >
                      {meta.name}
                    </span>
                    <span className="block text-[12px] text-text-muted">
                      {meta.railSub}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="px-1 text-[12.5px] leading-[1.5] text-text-muted">
        Everything is created together when you go live — nothing is saved until
        then.
      </p>
    </div>
  );
}
