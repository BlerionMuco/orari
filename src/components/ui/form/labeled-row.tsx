import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabeledRowProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  dim?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Generic row used by services list, hours days, reminders, profile flags.
// Title + subtitle on the left, trailing slot on the right (switch, badge,
// chevron). `children` renders below the row for expanded controls
// (start/end pickers when a hours day is open).
export function LabeledRow({
  title,
  subtitle,
  leading,
  trailing,
  dim,
  className,
  children,
}: LabeledRowProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[14px] border border-border bg-surface p-3.5",
        dim && "bg-bg",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {leading ? <div className="flex-none">{leading}</div> : null}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "truncate text-[14.5px] font-semibold",
              dim ? "text-text-muted" : "text-text",
            )}
          >
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-[12.5px] text-text-muted">
              {subtitle}
            </div>
          ) : null}
        </div>
        {trailing ? <div className="flex-none">{trailing}</div> : null}
      </div>
      {children}
    </div>
  );
}
