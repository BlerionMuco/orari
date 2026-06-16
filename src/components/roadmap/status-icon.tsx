import * as React from "react";
import { Check, Minus } from "lucide-react";
import type { RoadmapStatus } from "@/lib/roadmap";

const STATUS_LABEL: Record<RoadmapStatus, string> = {
  done: "Done",
  partial: "In progress",
  todo: "To do",
};

export function StatusIcon({
  status,
}: {
  status: RoadmapStatus;
}): React.JSX.Element {
  if (status === "done") {
    return (
      <span
        role="img"
        aria-label={STATUS_LABEL.done}
        className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success-bg text-success-text"
      >
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span
        role="img"
        aria-label={STATUS_LABEL.partial}
        className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-warning-bg text-warning-text"
      >
        <Minus className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={STATUS_LABEL.todo}
      className="h-5 w-5 flex-none rounded-full border-[1.5px] border-border-strong bg-surface"
    />
  );
}
