"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/buttons/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Label } from "@/components/ui/form/label";
import { Switch } from "@/components/ui/form/switch";
import { SectionCard } from "@/components/ui/display/section-card";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { useConfirm } from "@/lib/ui/use-confirm";
import { ServiceFormInput } from "@/lib/schemas/service";
import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "@/lib/services/actions";

export interface ServiceFormProps {
  mode: "new" | "edit";
  serviceId?: string;
  defaultValues: ServiceFormInput;
}

// New + edit share one form. Mode toggles label + button label + adds the
// delete control. Submit calls the matching server action; on success we toast
// and route back to the list, where revalidatePath has refreshed the data.
export function ServiceForm({
  mode,
  serviceId,
  defaultValues,
}: ServiceFormProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const confirm = useConfirm((s) => s.confirm);
  const [pending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(ServiceFormInput),
    defaultValues,
  });

  const active = watch("active");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const res =
        mode === "edit" && serviceId
          ? await updateServiceAction({ ...values, id: serviceId })
          : await createServiceAction(values);
      if (!res.ok) {
        show(res.error ?? "Couldn't save.", ToastVariant.ERROR);
        return;
      }
      show(mode === "edit" ? "Service saved" : "Service added");
      router.push("/dashboard/settings/services");
      router.refresh();
    });
  });

  const onDelete = async (): Promise<void> => {
    if (!serviceId) return;
    const accepted = await confirm({
      title: "Delete this service?",
      body: "It will be removed from your booking page. Past bookings keep their record.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!accepted) return;
    startTransition(async () => {
      const res = await deleteServiceAction({ id: serviceId });
      if (!res.ok) {
        show(res.error ?? "Couldn't delete.", ToastVariant.ERROR);
        return;
      }
      show("Service deleted");
      router.push("/dashboard/settings/services");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <SectionCard contentClassName="flex flex-col gap-4">
        <Field id="svc-name" label="Name" error={errors.name?.message}>
          <Input placeholder="Haircut" {...register("name")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="svc-dur"
            label="Duration"
            error={errors.durationMin?.message}
          >
            <NumericSuffixInput
              suffix="min"
              placeholder="30"
              inputMode="numeric"
              {...register("durationMin", { valueAsNumber: true })}
            />
          </Field>
          <Field id="svc-price" label="Price" error={errors.price?.message}>
            <NumericSuffixInput
              suffix="Lek"
              placeholder="800"
              inputMode="numeric"
              {...register("price", { valueAsNumber: true })}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Buffers"
        description="Padding before / after each booking — kept exclusive on the calendar."
        contentClassName="grid grid-cols-2 gap-3"
      >
        <Field
          id="svc-buf-before"
          label="Before"
          error={errors.beforeBufferMin?.message}
        >
          <NumericSuffixInput
            suffix="min"
            placeholder="5"
            inputMode="numeric"
            {...register("beforeBufferMin", { valueAsNumber: true })}
          />
        </Field>
        <Field
          id="svc-buf-after"
          label="After"
          error={errors.afterBufferMin?.message}
        >
          <NumericSuffixInput
            suffix="min"
            placeholder="0"
            inputMode="numeric"
            {...register("afterBufferMin", { valueAsNumber: true })}
          />
        </Field>
      </SectionCard>

      <SectionCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label htmlFor="svc-active">Active</Label>
            <p className="mt-1 text-[12.5px] text-text-muted">
              Inactive services don&apos;t show on your booking page.
            </p>
          </div>
          <Switch
            id="svc-active"
            checked={active}
            onCheckedChange={(value) =>
              setValue("active", value, { shouldDirty: true })
            }
          />
        </div>
      </SectionCard>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/dashboard/settings/services")}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" size="lg" loading={pending}>
          {mode === "edit" ? "Save changes" : "Add service"}
        </Button>
      </div>

      {mode === "edit" ? (
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onDelete}
          disabled={pending}
          className="mt-2 text-danger-text"
        >
          Delete service
        </Button>
      ) : null}
    </form>
  );
}

interface NumericSuffixInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix: string;
}

const NumericSuffixInput = React.forwardRef<HTMLInputElement, NumericSuffixInputProps>(
  function NumericSuffixInput({ suffix, className, ...props }, ref) {
    return (
      <div className="relative">
        <Input ref={ref} className={`pr-13 ${className ?? ""}`} {...props} />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-text-disabled">
          {suffix}
        </span>
      </div>
    );
  },
);
