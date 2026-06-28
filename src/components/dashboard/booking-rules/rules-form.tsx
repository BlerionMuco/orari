"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { ChipGroup } from "@/components/ui/form/chip-group";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import {
  BookingRulesFormInput,
  SLOT_GRANULARITY_OPTIONS,
} from "@/lib/schemas/booking-rules";
import { updateBusinessDefaultRulesAction } from "@/lib/booking-rules/actions";

export interface RulesFormProps {
  initial: BookingRulesFormInput;
}

const GRANULARITY_OPTIONS = SLOT_GRANULARITY_OPTIONS.map((min) => ({
  value: String(min),
  label: `${min} min`,
}));

// Edits the business-default booking rules (per-service overrides live on each
// service detail page). Lead time is in hours for human readability — the
// action multiplies by 60 before writing to `lead_time_min`.
export function RulesForm({ initial }: RulesFormProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookingRulesFormInput>({
    resolver: zodResolver(BookingRulesFormInput),
    defaultValues: initial,
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const res = await updateBusinessDefaultRulesAction(values);
      if (!res.ok) {
        show(res.error ?? "Couldn't save.", ToastVariant.ERROR);
        return;
      }
      show("Booking rules saved");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <SectionCard contentClassName="flex flex-col gap-4">
        <Field
          id="lead-time"
          label="Minimum lead time (hours)"
          hint="How far ahead a customer must book. Set to 0 for same-minute bookings."
          error={errors.leadTimeHours?.message}
        >
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            {...register("leadTimeHours", { valueAsNumber: true })}
          />
        </Field>
        <Field
          id="advance-window"
          label="Advance booking window (days)"
          hint="How far into the future customers can book."
          error={errors.advanceWindowDays?.message}
        >
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            {...register("advanceWindowDays", { valueAsNumber: true })}
          />
        </Field>
        <Field
          id="slot-granularity"
          label="Slot granularity"
          hint="Spacing between offered start times."
          error={errors.slotGranularityMin?.message}
        >
          <Controller
            control={control}
            name="slotGranularityMin"
            render={({ field }) => (
              <ChipGroup
                ariaLabel="Slot granularity"
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
                options={GRANULARITY_OPTIONS}
              />
            )}
          />
        </Field>
      </SectionCard>
      <div className="mt-1 flex justify-end">
        <Button type="submit" size="lg" loading={pending}>
          Save rules
        </Button>
      </div>
    </form>
  );
}
