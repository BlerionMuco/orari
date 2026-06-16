import * as React from "react";
import { OrariLogo } from "@/components/ui/brand/orari-logo";
import type { RoadmapStats, RoadmapStatus } from "@/lib/roadmap";
import { cn } from "@/lib/utils";

const SEGMENT_COLOR: Record<RoadmapStatus, string> = {
  done: "bg-success",
  partial: "bg-warning",
  todo: "bg-fill-subtle",
};

interface LegendEntry {
  label: string;
  count: number;
  dot: string;
}

export interface RoadmapHeaderProps {
  stats: RoadmapStats;
  segments: RoadmapStatus[];
  updated: string;
}

export function RoadmapHeader({
  stats,
  segments,
  updated,
}: RoadmapHeaderProps): React.JSX.Element {
  const legend: LegendEntry[] = [
    { label: "Done", count: stats.done, dot: "bg-success" },
    { label: "In progress", count: stats.partial, dot: "bg-warning" },
    { label: "To do", count: stats.todo, dot: "bg-border-strong" },
  ];

  return (
    <header className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <OrariLogo className="mb-5" />
      <h1 className="text-[24px] font-semibold tracking-tight text-text">
        V1 Roadmap
      </h1>
      <p className="mt-1.5 text-[14.5px] leading-[1.5] text-text-muted">
        Everything V1 needs, and what&apos;s built so far. Updated {updated}.
      </p>

      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-[15px] font-medium text-text">
          {stats.done} of {stats.total} done
        </span>
        <span className="text-[13px] text-text-muted">{stats.percent}%</span>
      </div>
      <div
        className="mt-2.5 flex gap-0.5"
        role="img"
        aria-label={`${stats.percent} percent complete`}
      >
        {segments.map((status, index) => (
          <span
            key={index}
            className={cn("h-2 flex-1 rounded-full", SEGMENT_COLOR[status])}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {legend.map((entry) => (
          <li
            key={entry.label}
            className="flex items-center gap-1.5 text-[13px] text-text-muted"
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", entry.dot)} />
            {entry.label} · {entry.count}
          </li>
        ))}
      </ul>
    </header>
  );
}
