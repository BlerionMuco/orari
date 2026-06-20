import * as React from "react";
import { OrariLogo } from "@/components/ui/brand/orari-logo";
import { cn } from "@/lib/utils";

export interface AuthHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function AuthHeader({
  title,
  subtitle,
  icon,
  className,
}: AuthHeaderProps): React.JSX.Element {
  return (
    <div className={cn("mb-6", className)}>
      <OrariLogo className="mb-6.5" />
      {icon ? (
        <div className="mb-4.5 flex h-12 w-12 items-center justify-center rounded-[13px] bg-primary-tint text-primary">
          {icon}
        </div>
      ) : null}
      <h2 className="text-[27px] font-semibold leading-[1.15] tracking-[-0.01em] text-text">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-[14.5px] leading-[1.5] text-text-muted">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
