"use client";

import * as React from "react";
import { Copy } from "lucide-react";

export interface ApplyAllButtonProps {
  sourceLabel: string;
  onApply: () => void;
  disabled?: boolean;
}

// Quick "Apply Monday to all open days" pattern from the prototype. Shown only
// when at least one open day exists with valid hours.
export function ApplyAllButton({
  sourceLabel,
  onApply,
  disabled,
}: ApplyAllButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onApply}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      Apply {sourceLabel} to all open days
    </button>
  );
}
