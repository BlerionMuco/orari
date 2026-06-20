import * as React from "react";

export interface StepShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

// Shared heading + spacing for each wizard step.
export function StepShell({
  title,
  subtitle,
  children,
}: StepShellProps): React.JSX.Element {
  return (
    <div>
      <h2 className="text-[23px] font-semibold tracking-[-0.015em] text-text lg:text-[25px] lg:tracking-[-0.02em]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-[13.5px] leading-[1.5] text-text-muted lg:text-[14px]">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-4 lg:mt-5">{children}</div>
    </div>
  );
}
