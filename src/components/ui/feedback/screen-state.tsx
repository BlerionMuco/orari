import * as React from "react";
import {
  AlertCircle,
  CalendarX,
  Inbox,
  Loader2,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ScreenStateKind = {
  EMPTY: "empty",
  ERROR: "error",
  LOADING: "loading",
  RESTRICTED: "restricted",
} as const;
export type ScreenStateKind = (typeof ScreenStateKind)[keyof typeof ScreenStateKind];

export const ScreenStateIcon = {
  INBOX: "inbox",
  CALENDAR: "calendar",
  LOCK: "lock",
  ALERT: "alert",
  SPINNER: "spinner",
} as const;
export type ScreenStateIcon = (typeof ScreenStateIcon)[keyof typeof ScreenStateIcon];

const ICON_MAP: Record<ScreenStateIcon, LucideIcon> = {
  inbox: Inbox,
  calendar: CalendarX,
  lock: Lock,
  alert: AlertCircle,
  spinner: Loader2,
};

const DEFAULT_ICON: Record<ScreenStateKind, ScreenStateIcon> = {
  empty: "inbox",
  error: "alert",
  loading: "spinner",
  restricted: "lock",
};

export interface ScreenStateProps {
  kind: ScreenStateKind;
  title: string;
  body?: string;
  icon?: ScreenStateIcon;
  action?: React.ReactNode;
  className?: string;
}

// Centered icon + title + body + optional CTA. Used as the empty / error /
// loading / restricted state inside a card or a full-page panel.
export function ScreenState({
  kind,
  title,
  body,
  icon,
  action,
  className,
}: ScreenStateProps): React.JSX.Element {
  const iconKey = icon ?? DEFAULT_ICON[kind];
  const Icon = ICON_MAP[iconKey];
  const spinning = iconKey === "spinner";
  return (
    <div
      role={kind === "error" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          kind === "error" && "bg-danger-bg text-danger",
          kind === "restricted" && "bg-warning-bg text-warning-text",
          (kind === "empty" || kind === "loading") && "bg-fill-subtle text-text-muted",
        )}
      >
        <Icon
          className={cn("h-6 w-6", spinning && "animate-spin")}
          aria-hidden="true"
        />
      </span>
      <h2 className="text-[15.5px] font-semibold text-text">{title}</h2>
      {body ? (
        <p className="max-w-72 text-[13.5px] leading-[1.45] text-text-muted">{body}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
