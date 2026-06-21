"use client";

import * as React from "react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Mail, X } from "lucide-react";
import { OnboardingInput } from "@/lib/schemas/onboarding";
import { StepShell } from "@/components/ui/wizard/step-shell";
import { Input } from "@/components/ui/form/input";
import { Switch } from "@/components/ui/form/switch";
import { Avatar } from "@/components/ui/media/avatar";
import { AddButton } from "@/components/ui/buttons/add-button";
import { AlertBanner } from "@/components/ui/feedback/alert-banner";

export function TeamStep(): React.JSX.Element {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<OnboardingInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "team" });

  const businessName = useWatch({ control, name: "name" }) ?? "";
  const ownerIsResource = useWatch({ control, name: "ownerIsResource" }) ?? false;
  const team = useWatch({ control, name: "team" }) ?? [];

  const bookable =
    (ownerIsResource ? 1 : 0) +
    team.filter((m) => m?.name?.trim().length > 0).length;

  const teamError = errors.team?.root?.message;

  return (
    <StepShell
      title="Who's on the team?"
      subtitle="Everyone added here becomes a bookable resource. You need at least one."
    >
      <div className="flex flex-col gap-4">
        {teamError ? <AlertBanner>{teamError}</AlertBanner> : null}

        {/* Owner row */}
        <div className="flex items-center gap-3 rounded-[14px] border border-border bg-surface p-3.5">
          <Avatar name={businessName || "You"} size="md" tone="solid" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-text">You</span>
              <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-pressed">
                Owner
              </span>
            </div>
            <span className="block text-[12.5px] text-text-muted">
              Make yourself bookable so customers can choose you.
            </span>
          </div>
          <Controller
            control={control}
            name="ownerIsResource"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="I take appointments myself"
              />
            )}
          />
        </div>

        {/* Members */}
        <div className="flex flex-col gap-3">
          {fields.map((row, i) => {
            const memberErr = errors.team?.[i];
            const memberName = team[i]?.name ?? "";
            return (
              <div
                key={row.id}
                className="rounded-[14px] border border-border bg-surface p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={memberName} size="sm" />
                  <Input
                    className="flex-1"
                    placeholder="Full name"
                    aria-label={`Team member ${i + 1} name`}
                    error={Boolean(memberErr?.name)}
                    {...register(`team.${i}.name`)}
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={`Remove team member ${i + 1}`}
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-text-muted transition-colors hover:border-danger hover:text-danger focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="relative mt-2.5">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled"
                    aria-hidden="true"
                  />
                  <Input
                    type="email"
                    autoComplete="off"
                    className="pl-9.5"
                    placeholder="Email for invite (optional)"
                    aria-label={`Team member ${i + 1} email`}
                    error={Boolean(memberErr?.email)}
                    {...register(`team.${i}.email`)}
                  />
                </div>
                {memberErr?.email ? (
                  <p className="mt-1 text-[12px] text-danger-text">
                    {memberErr.email.message}
                  </p>
                ) : null}
              </div>
            );
          })}

          <AddButton onClick={() => append({ name: "", email: "" })}>
            Add team member
          </AddButton>
        </div>

        <p className="text-[12.5px] text-text-muted">
          {bookable > 0
            ? `${bookable} ${bookable === 1 ? "person" : "people"} can be booked. Team members with an email get a login invite to manage their own slots.`
            : "No one is bookable yet — turn on “you”, or add a team member."}
        </p>
      </div>
    </StepShell>
  );
}
