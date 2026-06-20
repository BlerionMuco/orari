import * as React from "react";

// Public, unauthenticated shell — just the warm page background and base
// padding. The wizard owns its own responsive width (centered column on mobile,
// two-column on desktop).
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex h-dvh flex-col bg-bg px-4 py-4 lg:block lg:h-auto lg:min-h-screen lg:px-9 lg:py-8">
      {children}
    </div>
  );
}
