import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ScreenState,
  type ScreenStateIcon,
} from "@/components/ui/feedback/screen-state";

export interface EmptyListStateProps {
  title: string;
  body?: string;
  icon?: ScreenStateIcon;
  action?: React.ReactNode;
  className?: string;
}

// Shell-wrapped empty state for list pages (Services, Team, Calendar).
// Card chrome matches SectionCard so list and empty states share padding.
export function EmptyListState({
  title,
  body,
  icon,
  action,
  className,
}: EmptyListStateProps): React.JSX.Element {
  return (
    <div className={cn("rounded-[18px] border border-border bg-surface", className)}>
      <ScreenState kind="empty" icon={icon} title={title} body={body} action={action} />
    </div>
  );
}
