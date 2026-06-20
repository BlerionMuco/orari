"use client";

import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import {
  OnboardingInput,
  VERTICALS,
  VERTICAL_LABELS,
} from "@/lib/schemas/onboarding";
import { Vertical } from "@/lib/business/labels";
import { createBusinessAction } from "@/app/onboarding/actions";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Label } from "@/components/ui/form/label";
import { Checkbox } from "@/components/ui/form/checkbox";
import { Button } from "@/components/ui/buttons/button";
import { FormError } from "@/components/ui/feedback/form-error";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  "Europe/Tirane",
  "Europe/Rome",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Athens",
] as const;

export function OnboardingWizard(): React.JSX.Element {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [formError, setFormError] = React.useState<string>("");

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(OnboardingInput),
    defaultValues: {
      name: "",
      vertical: Vertical.BARBER,
      timezone: "Europe/Tirane",
      ownerIsResource: true,
      team: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "team" });

  async function goToTeam(): Promise<void> {
    const ok = await trigger(["name", "vertical", "timezone"]);
    if (ok) setStep(2);
  }

  const submit = handleSubmit(async (values) => {
    setFormError("");
    const result = await createBusinessAction(values);
    // On success the server action redirects; only an error returns here.
    if (result?.error) setFormError(result.error);
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-medium text-text-muted">
          Step {step} of 2
        </p>
        <h1 className="text-2xl font-semibold text-text">
          {step === 1 ? "Set up your business" : "Your team"}
        </h1>
        <p className="text-[14px] text-text-muted">
          {step === 1
            ? "The basics — you can change these later."
            : "Add whoever takes appointments. You can invite them by email anytime."}
        </p>
      </div>

      <FormError message={formError} />

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <Field id="name" label="Business name" error={errors.name?.message}>
            <Input
              type="text"
              autoComplete="organization"
              placeholder="Tirana Barber Co."
              {...register("name")}
            />
          </Field>

          <Controller
            control={control}
            name="vertical"
            render={({ field }) => (
              <div className="flex flex-col gap-1.75">
                <Label htmlFor="vertical">Type of business</Label>
                <div className="grid grid-cols-2 gap-2" id="vertical">
                  {VERTICALS.map((value) => {
                    const selected = field.value === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        aria-pressed={selected}
                        className={cn(
                          "min-h-11 rounded-[11px] border px-3 text-[14px] font-medium transition-colors",
                          "focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus",
                          selected
                            ? "border-primary bg-primary-tint text-primary-pressed"
                            : "border-border bg-surface text-text-muted hover:border-border-strong",
                        )}
                      >
                        {VERTICAL_LABELS[value]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          />

          <div className="flex flex-col gap-1.75">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              className={cn(
                "h-11.5 w-full rounded-[11px] border border-border bg-surface px-3 text-base text-text",
                "focus:outline-hidden focus:border-primary focus:ring-[3px] focus:ring-focus",
              )}
              {...register("timezone")}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace("Europe/", "")}
                </option>
              ))}
            </select>
            {errors.timezone ? (
              <p className="text-[13px] text-danger-text">
                {errors.timezone.message}
              </p>
            ) : null}
          </div>

          <Button type="button" block onClick={goToTeam}>
            Continue
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Controller
            control={control}
            name="ownerIsResource"
            render={({ field }) => (
              <label className="flex min-h-11 cursor-pointer items-start gap-2.25 text-[14px] leading-[1.45] text-text">
                <Checkbox
                  className="mt-0.75"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <span>
                  I take appointments myself
                  <span className="mt-0.5 block text-[13px] text-text-muted">
                    Adds you as a bookable resource.
                  </span>
                </span>
              </label>
            )}
          />

          <div className="flex flex-col gap-3">
            {fields.map((row, index) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-[12px] border border-border bg-surface p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-text-muted">
                    Team member {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Remove team member ${index + 1}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-fill-subtle hover:text-text focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <Field
                  id={`team-${index}-name`}
                  label="Name"
                  error={errors.team?.[index]?.name?.message}
                >
                  <Input
                    type="text"
                    placeholder="Jane Rossi"
                    {...register(`team.${index}.name`)}
                  />
                </Field>
                <Field
                  id={`team-${index}-email`}
                  label="Email (optional)"
                  hint="Leave blank to add them without a login invite."
                  error={errors.team?.[index]?.email?.message}
                >
                  <Input
                    type="email"
                    autoComplete="off"
                    placeholder="jane@example.com"
                    {...register(`team.${index}.email`)}
                  />
                </Field>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              block
              onClick={() => append({ name: "", email: "" })}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add team member
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              loading={isSubmitting}
              onClick={submit}
              className="flex-[2]"
            >
              Create business
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
