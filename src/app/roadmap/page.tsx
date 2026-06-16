import * as React from "react";
import type { Metadata } from "next";
import {
  V1_ROADMAP,
  V1_OUT_OF_SCOPE,
  V1_ROADMAP_UPDATED,
  getRoadmapStats,
  type RoadmapStatus,
} from "@/lib/roadmap";
import { RoadmapHeader } from "@/components/roadmap/roadmap-header";
import { RoadmapGroup } from "@/components/roadmap/roadmap-group";
import { OutOfScope } from "@/components/roadmap/out-of-scope";

export const metadata: Metadata = {
  title: "V1 Roadmap — Orari",
};

export default function RoadmapPage(): React.JSX.Element {
  const stats = getRoadmapStats(V1_ROADMAP);
  const segments: RoadmapStatus[] = V1_ROADMAP.flatMap((group) =>
    group.items.map((item) => item.status),
  );

  return (
    <main className="min-h-screen bg-bg px-4 py-8 sm:py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <RoadmapHeader
          stats={stats}
          segments={segments}
          updated={V1_ROADMAP_UPDATED}
        />
        {V1_ROADMAP.map((group) => (
          <RoadmapGroup key={group.title} group={group} />
        ))}
        <OutOfScope items={V1_OUT_OF_SCOPE} />
      </div>
    </main>
  );
}
