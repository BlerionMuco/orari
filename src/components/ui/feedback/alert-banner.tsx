import * as React from "react";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "error" | "info";

export interface AlertBannerProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const STYLES: Record<AlertVariant, string> = {
  error: "border-danger/30 bg-danger-bg text-danger-text",
  info: "border-border bg-fill-subtle text-text-muted",
};

// Block-level alert (form-wide error, or an info note). Distinct from the
// field-level `FormError`; use this for banners that aren't tied to one field.
export function AlertBanner({
  variant = "error",
  children,
  className,
}: AlertBannerProps): React.JSX.Element {
  const Icon = variant === "error" ? AlertCircle : Info;
  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={cn(
        "flex items-start gap-2 rounded-[13px] border px-3.5 py-3 text-[13px] leading-[1.45]",
        STYLES[variant],
        className,
      )}
    >
      <Icon className="mt-0.25 h-4 w-4 flex-none" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
