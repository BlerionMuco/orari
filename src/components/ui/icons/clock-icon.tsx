import * as React from "react";

export type ClockIconProps = React.SVGProps<SVGSVGElement>;

// The orari brand mark — a clock, nodding to orari = "opening hours" in Italian.
export function ClockIcon(props: ClockIconProps): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </svg>
  );
}
