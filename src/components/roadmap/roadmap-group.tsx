import * as React from "react";
import { RoadmapItem } from "@/components/roadmap/roadmap-item";
import type { RoadmapGroup as RoadmapGroupType } from "@/lib/roadmap";

export function RoadmapGroup({
  group,
}: {
  group: RoadmapGroupType;
}): React.JSX.Element {
  const doneCount = group.items.filter((item) => item.status === "done").length;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-tight text-text">
          {group.title}
        </h2>
        <span className="flex-none text-[13px] text-text-muted">
          {doneCount}/{group.items.length}
        </span>
      </div>
      <ul className="mt-1 divide-y divide-border">
        {group.items.map((item) => (
          <RoadmapItem key={item.label} item={item} />
        ))}
      </ul>
    </section>
  );
}
