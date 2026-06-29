import * as React from "react";

// 404 illustration: a compass whose needle sweeps around hunting for a
// bearing it never settles on (orari-seek).
export function CompassIllustration(): React.JSX.Element {
  return (
    <div className="relative flex size-32 items-center justify-center rounded-full border-[1.5px] border-primary-tint bg-surface shadow-[0_14px_32px_-16px_rgb(91_95_199/0.4)]">
      <span className="absolute top-[7px] text-[11px] font-semibold text-text-disabled">
        N
      </span>
      <span className="absolute bottom-[7px] text-[11px] font-semibold text-border-strong">
        S
      </span>
      <svg
        width="90"
        height="90"
        viewBox="0 0 90 90"
        className="animate-orari-seek"
        aria-hidden="true"
      >
        <path d="M45 9 L55 45 L45 39 L35 45 Z" className="fill-primary" />
        <path d="M45 81 L35 45 L45 51 L55 45 Z" className="fill-primary/40" />
      </svg>
      <span className="absolute size-[11px] rounded-full border-[2.5px] border-surface bg-text" />
    </div>
  );
}
