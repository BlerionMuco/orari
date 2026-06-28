import * as React from "react";
import { DashboardSidebar } from "./sidebar";
import { DashboardTabBar } from "./tab-bar";

export interface DashboardShellProps {
  businessName: string;
  children: React.ReactNode;
}

// Layout chrome shared by every dashboard view. Sidebar on md+, bottom-tab on
// mobile. Main scroll area gets bottom padding equal to the tab bar height so
// content isn't covered by the fixed nav.
export function DashboardShell({
  businessName,
  children,
}: DashboardShellProps): React.JSX.Element {
  return (
    <div className="flex min-h-dvh md:h-dvh md:min-h-0 md:overflow-hidden">
      <DashboardSidebar businessName={businessName} />
      <main className="min-h-dvh flex-1 overflow-x-hidden pb-[calc(theme(spacing.22)+env(safe-area-inset-bottom))] md:h-dvh md:min-h-0 md:overflow-y-auto md:pb-0">
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 sm:px-6 sm:pb-10 sm:pt-7">
          {children}
        </div>
      </main>
      <DashboardTabBar />
    </div>
  );
}
