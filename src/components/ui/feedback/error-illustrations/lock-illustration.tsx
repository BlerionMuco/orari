import * as React from "react";

// 403 illustration: a padlock that periodically rattles against the bezel.
// Shackle lifts (orari-shackle) while the whole lock shakes (orari-shake).
export function LockIllustration(): React.JSX.Element {
  return (
    <div className="relative flex flex-col items-center animate-orari-shake">
      <span className="h-7.5 w-11.5 rounded-t-[24px] border-[6px] border-b-0 border-primary animate-orari-shackle" />
      <span className="-mt-0.5 flex h-15 w-18.5 items-center justify-center rounded-[14px] bg-primary shadow-[0_10px_24px_-8px_rgb(91_95_199/0.5)]">
        <span className="relative -top-[3px] size-[9px] rounded-full bg-surface" />
        <span className="absolute mt-[9px] h-[13px] w-[5px] rounded-[3px] bg-surface" />
      </span>
    </div>
  );
}
