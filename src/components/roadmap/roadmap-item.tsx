import * as React from "react";
import { StatusIcon } from "@/components/roadmap/status-icon";
import type { RoadmapItem as RoadmapItemType } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

export function RoadmapItem({
  item,
}: {
  item: RoadmapItemType;
}): React.JSX.Element {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5">
        <StatusIcon status={item.status} />
      </span>
      <span className="flex-1">
        <span
          className={cn(
            "text-[15px] leading-snug",
            item.status === "todo" ? "text-text-muted" : "text-text",
          )}
        >
          {item.label}
        </span>
        {item.note ? (
          <span className="mt-0.5 block text-[13px] text-text-muted">
            {item.note}
          </span>
        ) : null}
      </span>
    </li>
  );
}
