"use client";

import * as React from "react";
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { Copy } from "lucide-react";
import { OnboardingInput } from "@/lib/schemas/onboarding";
import { StepShell } from "@/components/ui/wizard/step-shell";
import { Select } from "@/components/ui/form/select";
import { Switch } from "@/components/ui/form/switch";
import { TIME_OPTIONS } from "../constants";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function HoursStep(): React.JSX.Element {
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<OnboardingInput>();
  const { fields } = useFieldArray({ control, name: "hours" });
  const hours = useWatch({ control, name: "hours" }) ?? [];
  const openCount = hours.filter((d) => d?.open).length;

  function applyToAll(): void {
    const current = getValues("hours");
    const firstOpen = current.find((d) => d.open);
    if (!firstOpen) return;
    current.forEach((d, i) => {
      if (d.open) {
        setValue(`hours.${i}.start`, firstOpen.start, { shouldValidate: true });
        setValue(`hours.${i}.end`, firstOpen.end, { shouldValidate: true });
      }
    });
  }

  return (
    <StepShell
      title="When are you open?"
      subtitle="One shared weekly schedule for the whole shop. Booking availability is generated automatically from these hours."
    >
      <div className="flex flex-col gap-2.5">
        {fields.map((row, i) => {
          const open = hours[i]?.open ?? false;
          const endErr = errors.hours?.[i]?.end;
          return (
            <div
              key={row.id}
              className="rounded-[14px] border border-border bg-surface p-3"
            >
              <div className="flex items-center gap-3">
                <Controller
                  control={control}
                  name={`hours.${i}.open`}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label={`${DAY_NAMES[row.weekday]} open`}
                    />
                  )}
                />
                <span className="text-[14px] font-medium text-text">
                  {DAY_NAMES[row.weekday]}
                </span>
                <span
                  className={`ml-auto text-[12px] ${
                    open ? "text-success-text" : "text-text-disabled"
                  }`}
                >
                  {open ? "Open" : "Closed"}
                </span>
              </div>

              {open ? (
                <div className="mt-2.5 flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`hours.${i}.start`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TIME_OPTIONS}
                        aria-label={`${DAY_NAMES[row.weekday]} opening time`}
                        className="flex-1"
                      />
                    )}
                  />
                  <span className="text-[13px] text-text-muted">to</span>
                  <Controller
                    control={control}
                    name={`hours.${i}.end`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        options={TIME_OPTIONS}
                        error={Boolean(endErr)}
                        aria-label={`${DAY_NAMES[row.weekday]} closing time`}
                        className="flex-1"
                      />
                    )}
                  />
                </div>
              ) : null}

              {open && endErr ? (
                <p className="mt-1.5 text-[12px] text-danger-text">
                  {endErr.message}
                </p>
              ) : null}
            </div>
          );
        })}

        {openCount >= 2 ? (
          <button
            type="button"
            onClick={applyToAll}
            className="mt-1 inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Apply the first open day&apos;s hours to all open days
          </button>
        ) : null}

        {errors.hours?.root?.message ? (
          <p className="text-[13px] text-danger-text">
            {errors.hours.root.message}
          </p>
        ) : null}
      </div>
    </StepShell>
  );
}
