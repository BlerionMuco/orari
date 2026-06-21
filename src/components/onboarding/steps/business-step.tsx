"use client";

import * as React from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  Dumbbell,
  GraduationCap,
  Scissors,
  Sparkles,
  Stethoscope,
  Store,
} from "lucide-react";
import {
  OnboardingInput,
  VERTICALS,
  VERTICAL_LABELS,
} from "@/lib/schemas/onboarding";
import { StepShell } from "@/components/ui/wizard/step-shell";
import { Input } from "@/components/ui/form/input";
import { Label } from "@/components/ui/form/label";
import { Select } from "@/components/ui/form/select";
import {
  RadioGroup,
  RadioGroupItem,
  RadioCircle,
} from "@/components/ui/form/radio-group";
import { TIMEZONE_OPTIONS } from "../constants";

type VerticalValue = (typeof VERTICALS)[number];

const VERTICAL_META: Record<
  VerticalValue,
  { icon: React.ComponentType<{ className?: string }>; desc: string }
> = {
  barber: { icon: Scissors, desc: "Cuts, fades, beard work" },
  clinic: { icon: Stethoscope, desc: "Appointments & consultations" },
  tutor: { icon: GraduationCap, desc: "Lessons & sessions" },
  spa: { icon: Sparkles, desc: "Treatments & wellness" },
  fitness: { icon: Dumbbell, desc: "Classes & training" },
  other: { icon: Store, desc: "Anything you book by time" },
};

export function BusinessStep(): React.JSX.Element {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<OnboardingInput>();
  const name = useWatch({ control, name: "name" }) ?? "";

  return (
    <StepShell
      title="Tell us about your business"
      subtitle="The basics customers will see on your booking page."
    >
      <div className="flex flex-col gap-5">
        {/* Name + live counter */}
        <div className="flex flex-col gap-1.75">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="biz-name">Business name</Label>
            <span className="text-[12px] text-text-disabled">
              {name.trim().length}/120
            </span>
          </div>
          <Input
            id="biz-name"
            autoComplete="organization"
            placeholder="e.g. Beni Barber"
            error={Boolean(errors.name)}
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-[13px] text-danger-text">{errors.name.message}</p>
          ) : null}
        </div>

        {/* Vertical radio cards */}
        <div className="flex flex-col gap-1.75">
          <Label>Vertical</Label>
          <Controller
            control={control}
            name="vertical"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
              >
                {VERTICALS.map((value) => {
                  const Icon = VERTICAL_META[value].icon;
                  return (
                    <RadioGroupItem
                      key={value}
                      value={value}
                      className="flex items-center gap-3 rounded-[12px] border border-border bg-surface p-3 text-left transition-colors data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_0_3px_rgba(91,95,199,0.16)]"
                    >
                      <span className="flex h-9.5 w-9.5 flex-none items-center justify-center rounded-[11px] bg-fill-subtle text-text-muted transition-colors group-data-[state=checked]:bg-primary group-data-[state=checked]:text-surface">
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-text">
                          {VERTICAL_LABELS[value]}
                        </span>
                        <span className="block text-[12.5px] text-text-muted">
                          {VERTICAL_META[value].desc}
                        </span>
                      </span>
                      <RadioCircle />
                    </RadioGroupItem>
                  );
                })}
              </RadioGroup>
            )}
          />
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-1.75">
          <Label htmlFor="biz-tz">Timezone</Label>
          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <Select
                id="biz-tz"
                value={field.value}
                onValueChange={field.onChange}
                options={TIMEZONE_OPTIONS}
                placeholder="Pick a timezone"
                className="sm:max-w-85"
              />
            )}
          />
          <p className="text-[12px] text-text-muted">
            All your working hours are interpreted in this timezone.
          </p>
        </div>
      </div>
    </StepShell>
  );
}
