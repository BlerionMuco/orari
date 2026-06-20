import * as React from "react";

// Shared selectable-card surface for the service (CheckboxCard) and barber
// (RadioGroupItem) cards. Both Radix controls expose `data-state="checked"`, so
// one class string drives the selected look on either.
export const optionCardClass =
  "flex w-full touch-manipulation select-none items-center gap-3.25 rounded-[14px] border-[1.5px] border-border bg-surface p-3.5 text-left transition-[transform,border-color,background-color] hover:border-border-strong active:scale-[0.985] data-[state=checked]:border-primary data-[state=checked]:bg-primary-tint";

export interface OptionCardBodyProps {
  title: string;
  subtitle?: string;
  leading?: React.ReactNode; // avatar / icon
}

export function OptionCardBody({
  title,
  subtitle,
  leading,
}: OptionCardBodyProps): React.JSX.Element {
  return (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-semibold tracking-[-0.01em] text-text">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-1.25 block text-[13px] text-text-muted">
            {subtitle}
          </span>
        ) : null}
      </span>
    </>
  );
}
