import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, error = false, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          // Design specs 15px, but CLAUDE.md mandates ≥16px inputs to stop iOS
          // zoom-on-focus — the rule wins (text-base = 16px). h-[46px] > 44px.
          "h-[46px] w-full rounded-[11px] bg-surface px-3.5 text-base text-text",
          "border border-border placeholder:text-text-disabled",
          "transition-[color,border-color,box-shadow] focus:outline-hidden focus:border-primary focus:ring-[3px] focus:ring-focus",
          "disabled:bg-fill-subtle disabled:text-text-disabled disabled:cursor-not-allowed",
          error && "border-danger focus:border-danger",
          className,
        )}
        {...props}
      />
    );
  },
);
