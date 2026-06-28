"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DayStrip, type DayPill } from "@/components/ui/date/day-strip";
import { ChipGroup } from "@/components/ui/form/chip-group";

export const RESOURCE_FILTER_ALL = "all";

export interface DayFilterProps {
  todayIso: string;
  selectedIso: string;
  days: DayPill[];
  resourceOptions?: { id: string; name: string }[];
  selectedResource: string;
}

// Day strip + (owner-only) resource chip filter. Both controls update the
// route query, so the page re-renders against the new range — no client cache.
export function DayFilter({
  selectedIso,
  days,
  resourceOptions,
  selectedResource,
}: DayFilterProps): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();

  const navigate = (next: { date?: string; resource?: string }): void => {
    const qs = new URLSearchParams(params.toString());
    if (next.date) qs.set("date", next.date);
    if (next.resource) {
      if (next.resource === RESOURCE_FILTER_ALL) qs.delete("resource");
      else qs.set("resource", next.resource);
    }
    router.push(`/dashboard/calendar?${qs.toString()}`);
  };

  return (
    <div className="mb-5 flex flex-col gap-3">
      <DayStrip
        days={days}
        selectedIso={selectedIso}
        onPick={(iso) => navigate({ date: iso })}
      />
      {resourceOptions && resourceOptions.length > 1 ? (
        <ChipGroup
          ariaLabel="Resource"
          value={selectedResource}
          onValueChange={(value) => navigate({ resource: value })}
          options={[
            { value: RESOURCE_FILTER_ALL, label: "All" },
            ...resourceOptions.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
      ) : null}
    </div>
  );
}
