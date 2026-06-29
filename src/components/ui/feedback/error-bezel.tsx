import * as React from "react";

interface ErrorBezelProps {
  children: React.ReactNode;
}

// Shared animated frame behind every error illustration: a slowly spinning
// dashed ring, two pulsing rings, and a few drifting particles. The per-screen
// illustration (lock / compass / warning) is centered on top via `children`.
export function ErrorBezel({ children }: ErrorBezelProps): React.JSX.Element {
  return (
    <div className="relative mb-9 flex size-40 items-center justify-center sm:size-44">
      <span className="absolute inset-0 rounded-full border-[1.5px] border-primary-tint animate-orari-ring" />
      <span className="absolute inset-0 rounded-full border-[1.5px] border-primary-tint animate-orari-ring [animation-delay:1.4s]" />
      <svg
        viewBox="0 0 178 178"
        className="absolute inset-0 size-full animate-orari-spin"
        aria-hidden="true"
      >
        <circle
          cx="89"
          cy="89"
          r="80"
          fill="none"
          className="stroke-border"
          strokeWidth="2"
          strokeDasharray="2 12"
          strokeLinecap="round"
        />
      </svg>

      <span className="absolute left-6 top-8 size-[7px] rounded-full bg-border-strong animate-orari-drift" />
      <span className="absolute bottom-12 right-6 size-[5px] rounded-full bg-primary/40 animate-orari-float [animation-delay:0.8s]" />
      <span className="absolute right-9 top-12 size-1 rounded-full bg-border-strong animate-orari-float" />

      {children}
    </div>
  );
}
