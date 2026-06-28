"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { ChipGroup } from "@/components/ui/form/chip-group";
import { TimeSelect } from "@/components/ui/form/time-select";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { BlockTimeFormInput } from "@/lib/schemas/block-time";
import { createBlockTimeAction } from "@/lib/time-off/actions";

export interface BlockFormResourceOption {
  id: string;
  label: string;
}

export interface BlockFormProps {
  // null entry (id sentinel) = whole-shop closure (owner only). Staff get a
  // single locked option pointing at their own resource.
  resources: BlockFormResourceOption[];
  allowWholeShop: boolean;
  todayIso: string;
}

const RESOURCE_WHOLE_SHOP = "__whole_shop__";

interface FormShape {
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export function BlockForm({
  resources,
  allowWholeShop,
  todayIso,
}: BlockFormProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();

  const resourceOptions = React.useMemo(() => {
    const base = resources.map((r) => ({ value: r.id, label: r.label }));
    return allowWholeShop
      ? [{ value: RESOURCE_WHOLE_SHOP, label: "Whole shop" }, ...base]
      : base;
  }, [resources, allowWholeShop]);

  const defaultResource =
    resourceOptions[0]?.value ?? (allowWholeShop ? RESOURCE_WHOLE_SHOP : "");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: {
      resourceId: defaultResource,
      date: todayIso,
      startTime: "12:00",
      endTime: "13:00",
      reason: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    const parsed = BlockTimeFormInput.safeParse({
      resourceId:
        values.resourceId === RESOURCE_WHOLE_SHOP ? null : values.resourceId,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      reason: values.reason || undefined,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      show(first?.message ?? "Check the form fields.", ToastVariant.ERROR);
      return;
    }
    startTransition(async () => {
      const res = await createBlockTimeAction(parsed.data);
      if (!res.ok) {
        show(res.error ?? "Couldn't block time.", ToastVariant.ERROR);
        return;
      }
      show("Time blocked");
      router.push("/dashboard/calendar");
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <SectionCard title="Who" contentClassName="flex flex-col gap-4">
        <Field id="bt-resource" label="Barber">
          {resourceOptions.length > 1 ? (
            <Controller
              control={control}
              name="resourceId"
              render={({ field }) => (
                <ChipGroup
                  ariaLabel="Barber"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={resourceOptions}
                />
              )}
            />
          ) : (
            <Input value={resourceOptions[0]?.label ?? ""} readOnly />
          )}
        </Field>
      </SectionCard>

      <SectionCard title="When" contentClassName="flex flex-col gap-4">
        <Field id="bt-date" label="Date" error={errors.date?.message}>
          <Input
            type="date"
            min={todayIso}
            {...register("date", { required: "Pick a date." })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="bt-start" label="Start" error={errors.startTime?.message}>
            <Controller
              control={control}
              name="startTime"
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-label="Start time"
                />
              )}
            />
          </Field>
          <Field id="bt-end" label="End" error={errors.endTime?.message}>
            <Controller
              control={control}
              name="endTime"
              render={({ field }) => (
                <TimeSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-label="End time"
                />
              )}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Reason" contentClassName="flex flex-col gap-4">
        <Field
          id="bt-reason"
          label="Reason (optional)"
          hint="Shown only to staff."
          error={errors.reason?.message}
        >
          <Input maxLength={200} {...register("reason")} />
        </Field>
      </SectionCard>

      <div className="mt-1 flex justify-end">
        <Button type="submit" size="lg" loading={pending}>
          Block time
        </Button>
      </div>
    </form>
  );
}
