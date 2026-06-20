import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

// Plain textarea primitive, mirroring Input (Radix has no textarea). text-base
// (16px) to prevent iOS zoom; matching border/focus tokens.
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, error = false, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          "w-full resize-none rounded-[11px] border border-border bg-surface px-3.5 py-3 text-base text-text placeholder:text-text-disabled",
          "transition-[color,border-color,box-shadow] focus:border-primary focus:outline-hidden focus:ring-[3px] focus:ring-focus",
          error && "border-danger focus:border-danger",
          className,
        )}
        {...props}
      />
    );
  },
);
