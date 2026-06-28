import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  trailing?: React.ReactNode;
  as?: "section" | "div";
  contentClassName?: string;
}

// Outer wrapper used by every settings panel, profile section, billing card.
// Optional header (title + description + trailing slot for an action button)
// is rendered above `children`.
export function SectionCard({
  title,
  description,
  trailing,
  className,
  contentClassName,
  children,
  as = "section",
  ...props
}: SectionCardProps): React.JSX.Element {
  const Component = as;
  const showHeader = title || description || trailing;
  return (
    <Component
      className={cn(
        "rounded-[18px] border border-border bg-surface p-4 sm:p-5",
        className,
      )}
      {...props}
    >
      {showHeader ? (
        <header className="mb-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="text-[15.5px] font-semibold tracking-[-0.01em] text-text">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-[13px] leading-[1.45] text-text-muted">
                {description}
              </p>
            ) : null}
          </div>
          {trailing ? <div className="flex-none">{trailing}</div> : null}
        </header>
      ) : null}
      <div className={cn(contentClassName)}>{children}</div>
    </Component>
  );
}
