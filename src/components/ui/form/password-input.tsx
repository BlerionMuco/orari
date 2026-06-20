"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/form/input";
import { cn } from "@/lib/utils";

export type PasswordInputProps = Omit<InputProps, "type">;

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-11.5", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex h-8.5 w-8.5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-text-muted hover:text-text focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
      >
        {visible ? (
          <EyeOff
            className="h-4.5 w-4.5"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        ) : (
          <Eye className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden="true" />
        )}
      </button>
    </div>
  );
});
