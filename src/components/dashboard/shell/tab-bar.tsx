import * as React from "react";
import { Calendar, Home, Settings } from "lucide-react";
import { NavLink } from "@/components/ui/nav/nav-link";

// Mobile-only sticky bottom tabs. Safe-area aware so the tab row sits above
// the home indicator on iOS / gesture bars on Android.
export function DashboardTabBar(): React.JSX.Element {
  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <NavLink href="/dashboard" label="Home" variant="tab" icon={<Home className="h-5 w-5" />} />
      <NavLink
        href="/dashboard/calendar"
        label="Calendar"
        variant="tab"
        icon={<Calendar className="h-5 w-5" />}
      />
      <NavLink
        href="/dashboard/settings"
        label="Settings"
        variant="tab"
        matchPrefix
        icon={<Settings className="h-5 w-5" />}
      />
    </nav>
  );
}
