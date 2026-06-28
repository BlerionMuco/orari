import * as React from "react";
import { Check } from "lucide-react";
import { SectionCard } from "@/components/ui/display/section-card";

const INCLUDED: readonly string[] = [
  "Unlimited bookings",
  "Multiple barbers",
  "Public booking page",
  "Email confirmations",
];

// Plan summary for the current free trial. No price, no CTA — just a list
// of what's already on. Paid plans land in M7+.
export function PlanStub(): React.JSX.Element {
  return (
    <SectionCard title="Current plan" description="Free during the trial.">
      <ul className="flex flex-col gap-2">
        {INCLUDED.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2.5 text-[13.5px] text-text"
          >
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success-bg text-success-text">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
