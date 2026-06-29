import * as React from "react";

// 500 illustration: a warning triangle with a gently bouncing exclamation
// mark (orari-bounce).
export function WarningIllustration(): React.JSX.Element {
  return (
    <div className="relative flex h-28 w-31 -translate-y-1.5 items-center justify-center">
      <svg
        width="124"
        height="112"
        viewBox="0 0 124 112"
        className="absolute inset-0 drop-shadow-[0_12px_26px_rgb(91_95_199/0.42)]"
        aria-hidden="true"
      >
        <path
          d="M69.8 22 L110.2 94 Q118 108 102 108 L26 108 Q10 108 17.4 93.8 L54.6 22.2 Q62 8 69.8 22 Z"
          className="fill-primary"
        />
      </svg>
      <div className="relative top-3.5 flex flex-col items-center gap-[5px] animate-orari-bounce">
        <span className="h-7 w-[7px] rounded-[4px] bg-surface" />
        <span className="size-2 rounded-full bg-surface" />
      </div>
    </div>
  );
}
