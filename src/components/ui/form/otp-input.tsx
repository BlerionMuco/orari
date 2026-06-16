"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  id?: string;
  onComplete?: (value: string) => void;
  "aria-describedby"?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = false,
  id,
  onComplete,
  "aria-describedby": ariaDescribedBy,
}: OtpInputProps): React.JSX.Element {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const cells = Array.from({ length }, (_, i) => value[i] ?? "");

  function focusCell(index: number): void {
    const clamped = Math.max(0, Math.min(index, length - 1));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  }

  function emit(next: string): void {
    onChange(next);
    if (next.length === length && /^\d+$/.test(next)) {
      onComplete?.(next);
    }
  }

  function fillFrom(index: number, digits: string): void {
    const next = [...cells];
    for (let i = 0; i < digits.length && index + i < length; i += 1) {
      next[index + i] = digits[i];
    }
    emit(next.join(""));
    focusCell(index + digits.length);
  }

  function handleChange(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    const digits = event.target.value.replace(/\D/g, "");
    if (!digits) return;
    fillFrom(index, digits);
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...cells];
      if (next[index]) {
        next[index] = "";
        emit(next.join(""));
      } else if (index > 0) {
        next[index - 1] = "";
        emit(next.join(""));
        focusCell(index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusCell(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusCell(index + 1);
    }
  }

  function handlePaste(
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ): void {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (digits) fillFrom(index, digits);
  }

  return (
    <div
      role="group"
      id={id}
      aria-label="Verification code"
      aria-describedby={ariaDescribedBy}
      className="flex items-center gap-[9px]"
    >
      {cells.map((cell, index) => (
        <input
          // index is a stable position in a fixed-length code, safe as key
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          maxLength={1}
          disabled={disabled}
          value={cell}
          aria-invalid={error || undefined}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className={cn(
            "h-14 min-w-0 flex-1 rounded-[11px] border bg-surface text-center text-[23px] font-medium text-text",
            "transition-[color,border-color,box-shadow] focus:outline-hidden focus:border-primary focus:ring-[3px] focus:ring-focus",
            "disabled:bg-fill-subtle disabled:text-text-disabled",
            error ? "border-danger" : "border-border",
          )}
        />
      ))}
    </div>
  );
}
