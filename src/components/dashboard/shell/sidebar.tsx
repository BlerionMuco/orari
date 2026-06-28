import * as React from "react";
import { Calendar, ChevronsUpDown, Home, Settings } from "lucide-react";
import { NavLink } from "@/components/ui/nav/nav-link";
import { initials } from "@/lib/business/initials";

export interface DashboardSidebarProps {
  businessName: string;
}

// Desktop-only persistent sidebar. Tab bar (mobile) renders the same three
// destinations; both lean on NavLink for active-state styling. Sign out lives
// inside Settings → Account, not here. Store switcher card is presentational
// for V1 (one-business-per-user); the chevrons hint at the future swap UX.
export function DashboardSidebar({
  businessName,
}: DashboardSidebarProps): React.JSX.Element {
  return (
    <aside className="hidden h-dvh w-62 flex-none flex-col border-r border-border bg-bg p-4 md:flex">
      <div
        className="mb-4.5 flex w-full items-center gap-2.5 rounded-[13px] border border-border bg-surface p-2.5"
        aria-label="Current store"
      >
        <span
          aria-hidden="true"
          className="flex h-8.5 w-8.5 flex-none items-center justify-center rounded-[10px] bg-primary text-[14px] font-semibold text-surface"
        >
          {initials(businessName)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-text">
            {businessName}
          </span>
          <span className="text-[11.5px] text-text-muted">Switch store</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 flex-none text-text-muted" aria-hidden="true" />
      </div>
      <nav aria-label="Dashboard" className="flex flex-col gap-1">
        <NavLink href="/dashboard" label="Home" icon={<Home className="h-4.5 w-4.5" />} />
        <NavLink
          href="/dashboard/calendar"
          label="Calendar"
          icon={<Calendar className="h-4.5 w-4.5" />}
        />
      </nav>
      <div className="mt-auto">
        <NavLink
          href="/dashboard/settings"
          label="Settings"
          matchPrefix
          icon={<Settings className="h-4.5 w-4.5" />}
        />
      </div>
    </aside>
  );
}
