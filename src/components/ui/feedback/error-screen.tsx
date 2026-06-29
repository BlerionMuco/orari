import * as React from "react";
import { cn } from "@/lib/utils";

export interface ErrorScreenProps {
  /** HTTP status shown in the ERROR badge, e.g. "404". */
  code: string;
  title: string;
  body: string;
  /** The animated illustration, typically an <ErrorBezel> wrapping a leaf. */
  illustration: React.ReactNode;
  /** Action row — usually one primary + one secondary <Button>. */
  actions: React.ReactNode;
  /** Set on the 500 screen so assistive tech announces the failure. */
  alert?: boolean;
  /**
   * Render inside an existing layout shell (e.g. the dashboard) instead of
   * taking the full viewport. Shrinks the outer min-height so it doesn't
   * fight the surrounding chrome.
   */
  embedded?: boolean;
}

// Full-height, centered error panel shared by the 403 / 404 / 500 screens.
// Purely presentational: copy, illustration, and actions come from the route.
export function ErrorScreen({
  code,
  title,
  body,
  illustration,
  actions,
  alert = false,
  embedded = false,
}: ErrorScreenProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex items-center justify-center p-6",
        embedded ? "min-h-[70vh]" : "min-h-[100dvh]",
      )}
    >
      <div
        role={alert ? "alert" : undefined}
        className={cn(
          "relative flex w-full max-w-md flex-col items-center overflow-hidden",
          "rounded-[18px] border border-border bg-bg px-6 py-12 text-center",
          "sm:px-10 sm:py-14",
        )}
      >
        {illustration}

        <span className="mb-5 rounded-lg bg-info-bg px-3 py-1.5 font-mono text-[13px] font-semibold tracking-[0.16em] text-info-text animate-orari-rise">
          ERROR {code}
        </span>
        <h2 className="mb-3 text-[22px] font-semibold tracking-[-0.01em] text-text animate-orari-rise [animation-delay:0.06s] sm:text-2xl">
          {title}
        </h2>
        <p className="mb-7 max-w-80 text-[15px] leading-relaxed text-text-muted animate-orari-rise [animation-delay:0.12s]">
          {body}
        </p>
        <div className="flex w-full flex-col gap-2.5 animate-orari-rise [animation-delay:0.18s] sm:w-auto sm:flex-row">
          {actions}
        </div>
      </div>
    </div>
  );
}
