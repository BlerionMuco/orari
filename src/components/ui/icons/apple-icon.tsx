import * as React from "react";

export type AppleIconProps = React.SVGProps<SVGSVGElement>;

export function AppleIcon(props: AppleIconProps): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M16.365 1.43c0 1.14-.42 2.21-1.12 3.02-.84.97-2.2 1.72-3.32 1.63-.14-1.12.43-2.31 1.1-3.06.77-.86 2.13-1.5 3.34-1.59zM20.5 17.06c-.61 1.4-.9 2.02-1.69 3.26-1.1 1.73-2.65 3.88-4.57 3.9-1.71.02-2.15-1.12-4.47-1.1-2.32.01-2.8 1.13-4.51 1.11-1.92-.02-3.39-1.96-4.49-3.69C-1.6 17.34-1.86 11.3 1.04 8.27c1.03-1.08 2.49-1.76 4.06-1.76 1.65 0 2.68 1.12 4.04 1.12 1.32 0 2.12-1.12 4.03-1.12 1.41 0 2.91.77 3.97 2.1-3.49 1.91-2.92 6.9.36 8.45z" />
    </svg>
  );
}
