"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { replaceWorkingHoursAction } from "@/lib/hours/actions";
import type { DayHoursInput } from "@/lib/schemas/onboarding";
import { DayRow } from "./day-row";
import { ApplyAllButton } from "./apply-all-button";

const WEEKDAY_LABEL_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

// Display order: Mon, Tue, … Sat, Sun — matches the prototype.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export interface HoursEditorProps {
  resourceId: string;
  initialHours: DayHoursInput[];
}

function isValidRow(row: DayHoursInput): boolean {
  return !row.open || row.end > row.start;
}

export function HoursEditor({
  resourceId,
  initialHours,
}: HoursEditorProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();
  // Parent passes key={resourceId} so this component remounts on resource
  // switch — no setState-in-effect needed to reseed `hours` from props.
  const [hours, setHours] = React.useState<DayHoursInput[]>(initialHours);

  const updateDay = (weekday: number, patch: Partial<DayHoursInput>): void => {
    setHours((prev) =>
      prev.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)),
    );
  };

  const referenceOpen = hours
    .slice()
    .sort((a, b) => (a.weekday === 0 ? 7 : a.weekday) - (b.weekday === 0 ? 7 : b.weekday))
    .find((row) => row.open && isValidRow(row));

  const onApplyAll = (): void => {
    if (!referenceOpen) return;
    setHours((prev) =>
      prev.map((row) =>
        row.open && row.weekday !== referenceOpen.weekday
          ? { ...row, start: referenceOpen.start, end: referenceOpen.end }
          : row,
      ),
    );
  };

  const anyInvalid = hours.some((row) => !isValidRow(row));

  const onSave = (): void => {
    if (anyInvalid) {
      show("Fix the highlighted days first.", ToastVariant.ERROR);
      return;
    }
    startTransition(async () => {
      const res = await replaceWorkingHoursAction({ resourceId, hours });
      if (!res.ok) {
        show(res.error ?? "Couldn't save.", ToastVariant.ERROR);
        return;
      }
      show("Hours saved");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionCard contentClassName="flex flex-col gap-2">
        {DISPLAY_ORDER.map((weekday) => {
          const row = hours.find((r) => r.weekday === weekday);
          if (!row) return null;
          return (
            <DayRow
              key={weekday}
              weekday={weekday}
              open={row.open}
              start={row.start}
              end={row.end}
              onOpenChange={(open) => updateDay(weekday, { open })}
              onStartChange={(start) => updateDay(weekday, { start })}
              onEndChange={(end) => updateDay(weekday, { end })}
            />
          );
        })}
      </SectionCard>
      {referenceOpen ? (
        <ApplyAllButton
          sourceLabel={WEEKDAY_LABEL_SHORT[referenceOpen.weekday]}
          onApply={onApplyAll}
          disabled={pending}
        />
      ) : null}
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.refresh()}
          disabled={pending}
        >
          Reset
        </Button>
        <Button type="button" size="lg" onClick={onSave} loading={pending}>
          Save hours
        </Button>
      </div>
    </div>
  );
}
