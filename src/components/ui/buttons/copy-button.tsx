"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopyButtonProps {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
}

// Copies `value` to the clipboard and flips its label to "Copied" for ~1.6s.
export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className,
}: CopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard blocked (insecure context / denied) — keep silent; nothing to fall back to.
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3 text-[13px] font-semibold text-text transition-colors",
        "hover:border-border-strong hover:bg-bg",
        "focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus",
        className,
      )}
      aria-live="polite"
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4 text-text-muted" aria-hidden="true" />
      )}
      {copied ? copiedLabel : label}
    </button>
  );
}
