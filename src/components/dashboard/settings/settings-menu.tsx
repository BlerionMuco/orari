import * as React from "react";
import {
  Bell,
  Clock,
  CreditCard,
  Scissors,
  SlidersHorizontal,
  Store,
  User,
  Users,
} from "lucide-react";
import { SectionCard } from "@/components/ui/display/section-card";
import { SettingRow } from "@/components/ui/display/setting-row";
import type { MemberRole } from "@/db/schema";

interface MenuEntry {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const SHOP_ITEMS: MenuEntry[] = [
  {
    href: "/dashboard/settings/services",
    title: "Services",
    subtitle: "Catalog, prices, durations",
    icon: <Scissors className="h-4.5 w-4.5" />,
  },
  {
    href: "/dashboard/settings/team",
    title: "Team & resources",
    subtitle: "Barbers, chairs, invites",
    icon: <Users className="h-4.5 w-4.5" />,
  },
  {
    href: "/dashboard/settings/hours",
    title: "Working hours",
    subtitle: "Weekly schedule per resource",
    icon: <Clock className="h-4.5 w-4.5" />,
  },
  {
    href: "/dashboard/settings/booking-rules",
    title: "Booking rules",
    subtitle: "Lead time, advance window, buffers",
    icon: <SlidersHorizontal className="h-4.5 w-4.5" />,
  },
  {
    href: "/dashboard/settings/reminders",
    title: "Reminders",
    subtitle: "Notify customers before their slot",
    icon: <Bell className="h-4.5 w-4.5" />,
  },
  {
    href: "/dashboard/settings/profile",
    title: "Business profile",
    subtitle: "Public page, logo, slug",
    icon: <Store className="h-4.5 w-4.5" />,
  },
  {
    href: "/dashboard/settings/billing",
    title: "Billing",
    subtitle: "Trial, plan, invoices",
    icon: <CreditCard className="h-4.5 w-4.5" />,
  },
];

const STAFF_HOURS_ITEM: MenuEntry = {
  href: "/dashboard/settings/hours",
  title: "My working hours",
  subtitle: "Your weekly availability",
  icon: <Clock className="h-4.5 w-4.5" />,
};

const YOU_ITEMS: MenuEntry[] = [
  {
    href: "/dashboard/settings/account",
    title: "Account",
    subtitle: "Profile, password, sign out",
    icon: <User className="h-4.5 w-4.5" />,
  },
];

// Role-aware settings index. Owner gets the full Shop block; staff gets only
// their own working hours under "You". Same card chrome on both so the layout
// doesn't shift when the role changes.
export function SettingsMenu({ role }: { role: MemberRole }): React.JSX.Element {
  const isOwner = role === "owner";
  return (
    <div className="flex flex-col gap-3">
      {isOwner ? (
        <SectionCard title="Shop">
          <ul className="flex flex-col">
            {SHOP_ITEMS.map((item) => (
              <li key={item.href}>
                <SettingRow
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  subtitle={item.subtitle}
                />
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
      <SectionCard title="You">
        <ul className="flex flex-col">
          {(isOwner ? YOU_ITEMS : [STAFF_HOURS_ITEM, ...YOU_ITEMS]).map((item) => (
            <li key={item.href}>
              <SettingRow
                href={item.href}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
              />
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
