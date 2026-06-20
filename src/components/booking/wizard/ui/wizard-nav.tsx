import * as React from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { cn } from "@/lib/utils";

export interface WizardNavProps {
  showBack: boolean;
  onBack: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled: boolean;
  primaryBusy: boolean;
  primaryArrow: boolean;
  className?: string;
}

// Responsive: mobile = full-width bottom bar (Continue fills); desktop =
// right-aligned (Back pushed left). Both buttons are the shared `Button`. The
// big CTA keeps the brand shadow + a grey (not faded) disabled look via local
// className overrides.
export function WizardNav({
  showBack,
  onBack,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  primaryBusy,
  primaryArrow,
  className,
}: WizardNavProps): React.JSX.Element {
  return (
    <div className={cn("flex gap-3 lg:items-center lg:justify-end", className)}>
      {showBack ? (
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="lg:mr-auto"
        >
          <ChevronLeft className="h-4.25 w-4.25" strokeWidth={2.1} />
          Back
        </Button>
      ) : null}
      <Button
        size="lg"
        onClick={onPrimary}
        disabled={primaryDisabled}
        loading={primaryBusy}
        className="flex-1 shadow-[0_8px_20px_-8px_rgba(91,95,199,0.5)] disabled:bg-fill-subtle disabled:text-text-disabled disabled:opacity-100 disabled:shadow-none lg:flex-none lg:px-7"
      >
        <span>{primaryLabel}</span>
        {primaryArrow && !primaryBusy ? (
          <ArrowRight className="h-4.5 w-4.5" strokeWidth={2.2} />
        ) : null}
      </Button>
    </div>
  );
}
