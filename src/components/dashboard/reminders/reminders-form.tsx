"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { Switch } from "@/components/ui/form/switch";
import { LabeledRow } from "@/components/ui/form/labeled-row";
import { ChipGroup } from "@/components/ui/form/chip-group";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import {
  ReminderTiming,
  RemindersFormInput,
} from "@/lib/schemas/reminders";
import { updateReminderSettingsAction } from "@/lib/reminders/actions";

export interface RemindersFormProps {
  initial: RemindersFormInput;
}

const TIMING_OPTIONS = [
  { value: ReminderTiming.ONE_DAY, label: "24h before" },
  { value: ReminderTiming.ONE_HOUR, label: "1h before" },
  { value: ReminderTiming.BOTH, label: "Both" },
];

// Email reminders are the V1 default. SMS lives on a separate "coming soon"
// row (disabled until the SMS provider is wired). When the toggle is off the
// timing chip group is dimmed but kept rendered, so flipping the switch back
// on doesn't reset the operator's previous choice.
export function RemindersForm({
  initial,
}: RemindersFormProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RemindersFormInput>({
    resolver: zodResolver(RemindersFormInput),
    defaultValues: initial,
  });
  const enabled = watch("enabled");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const res = await updateReminderSettingsAction(values);
      if (!res.ok) {
        show(res.error ?? "Couldn't save.", ToastVariant.ERROR);
        return;
      }
      show("Reminders saved");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <SectionCard contentClassName="flex flex-col gap-3">
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <LabeledRow
              title="Email reminders"
              subtitle="Send a heads-up to the customer before their slot."
              trailing={
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label="Toggle email reminders"
                />
              }
            />
          )}
        />
        <LabeledRow
          title="SMS reminders"
          subtitle="Coming soon."
          dim
          trailing={
            <Switch checked={false} disabled aria-label="SMS reminders (coming soon)" />
          }
        />
        <div className={enabled ? "" : "opacity-60"}>
          <p className="mb-2 text-[13px] font-semibold text-text">When to send</p>
          <Controller
            control={control}
            name="timing"
            render={({ field }) => (
              <ChipGroup
                ariaLabel="Reminder timing"
                value={field.value}
                onValueChange={(v) => field.onChange(v)}
                options={TIMING_OPTIONS}
                className={enabled ? "" : "pointer-events-none"}
              />
            )}
          />
          {errors.timing?.message ? (
            <p className="mt-1 text-[13px] text-danger-text">
              {errors.timing.message}
            </p>
          ) : null}
        </div>
      </SectionCard>
      <div className="mt-1 flex justify-end">
        <Button type="submit" size="lg" loading={pending}>
          Save reminders
        </Button>
      </div>
    </form>
  );
}
