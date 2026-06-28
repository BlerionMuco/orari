"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { ChipGroup } from "@/components/ui/form/chip-group";
import { Skeleton } from "@/components/ui/feedback/skeleton";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { NewBookingFormInput } from "@/lib/schemas/new-booking";
import {
  createManualBookingAction,
  listManualSlotsAction,
  type ManualSlot,
} from "@/app/(dashboard)/dashboard/new-booking/actions";

export interface BookingFormOption {
  id: string;
  label: string;
  caption?: string;
}

export interface BookingFormProps {
  services: BookingFormOption[];
  resources: BookingFormOption[];
  // Today, in business-local YYYY-MM-DD — used as the date input's `min` so a
  // dashboard user can't accidentally book into the past.
  todayIso: string;
}

const RESOURCE_ANY = "__any__";

interface FormShape {
  serviceIds: string[];
  resourceId: string; // RESOURCE_ANY sentinel or concrete id; mapped at submit
  dayIso: string;
  startUtc: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
}

export function BookingForm({
  services,
  resources,
  todayIso,
}: BookingFormProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();
  const [slots, setSlots] = React.useState<ManualSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState<boolean>(false);
  const [slotsError, setSlotsError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: {
      serviceIds: [],
      resourceId: RESOURCE_ANY,
      dayIso: todayIso,
      startUtc: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      notes: "",
    },
  });

  const serviceIds = watch("serviceIds");
  const resourceId = watch("resourceId");
  const dayIso = watch("dayIso");
  const startUtc = watch("startUtc");

  // Refetch slots whenever the basket / resource / day changes. A monotonic seq
  // guard discards out-of-order responses so a slow request can't overwrite a
  // fresher one.
  const seqRef = React.useRef(0);
  React.useEffect(() => {
    if (serviceIds.length === 0 || !dayIso) {
      setSlots([]);
      return;
    }
    const mySeq = ++seqRef.current;
    setSlotsLoading(true);
    setSlotsError(null);
    void (async (): Promise<void> => {
      const res = await listManualSlotsAction({
        serviceIds,
        resourceId: resourceId === RESOURCE_ANY ? null : resourceId,
        dayIso,
      });
      if (mySeq !== seqRef.current) return;
      setSlotsLoading(false);
      if (!res.ok) {
        setSlots([]);
        setSlotsError(res.error ?? "Couldn't load slots.");
        return;
      }
      setSlots(res.slots);
      // Clear a previously-picked slot if it's no longer offered.
      if (startUtc && !res.slots.some((s) => s.startUtc === startUtc)) {
        setValue("startUtc", "");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIds, resourceId, dayIso]);

  const resourceOptions = React.useMemo(
    () => [
      { value: RESOURCE_ANY, label: "Any available" },
      ...resources.map((r) => ({ value: r.id, label: r.label })),
    ],
    [resources],
  );

  const serviceOptions = React.useMemo(
    () =>
      services.map((s) => ({ value: s.id, label: s.label, caption: s.caption })),
    [services],
  );

  const slotOptions = React.useMemo(
    () => slots.map((s) => ({ value: s.startUtc, label: s.label })),
    [slots],
  );

  const onSubmit = handleSubmit((values) => {
    const parsed = NewBookingFormInput.safeParse({
      serviceIds: values.serviceIds,
      resourceId: values.resourceId === RESOURCE_ANY ? null : values.resourceId,
      startsAt: values.startUtc,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail,
      notes: values.notes,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      show(first?.message ?? "Check the form fields.", ToastVariant.ERROR);
      return;
    }
    startTransition(async () => {
      const res = await createManualBookingAction(parsed.data);
      if (!res.ok) {
        show(res.error ?? "Couldn't create booking.", ToastVariant.ERROR);
        return;
      }
      show("Booking created");
      router.push(res.bookingId ? `/dashboard/bookings/${res.bookingId}` : "/dashboard");
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <SectionCard title="What & who" contentClassName="flex flex-col gap-4">
        <Field
          id="nb-services"
          label="Services"
          hint="Pick one or more — buffers stack in order."
          error={errors.serviceIds?.message}
        >
          <Controller
            control={control}
            name="serviceIds"
            rules={{ validate: (v) => v.length > 0 || "Pick a service." }}
            render={({ field }) => (
              <ChipGroup
                multi
                ariaLabel="Services"
                values={field.value}
                onValuesChange={field.onChange}
                options={serviceOptions}
              />
            )}
          />
        </Field>
        <Field id="nb-resource" label="Barber">
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
        </Field>
      </SectionCard>

      <SectionCard title="When" contentClassName="flex flex-col gap-4">
        <Field
          id="nb-day"
          label="Day"
          error={errors.dayIso?.message}
        >
          <Input
            type="date"
            min={todayIso}
            {...register("dayIso", { required: "Pick a day." })}
          />
        </Field>
        <Field
          id="nb-time"
          label="Time"
          hint="Only slots that fit the basket and barber's hours are shown."
          error={slotsError ?? errors.startUtc?.message}
        >
          {slotsLoading ? (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-20 rounded-[11px]" />
              <Skeleton className="h-10 w-20 rounded-[11px]" />
              <Skeleton className="h-10 w-20 rounded-[11px]" />
              <Skeleton className="h-10 w-20 rounded-[11px]" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-[13px] text-text-muted">
              {serviceIds.length === 0
                ? "Pick a service first."
                : "No slots for this day. Try another day or barber."}
            </p>
          ) : (
            <Controller
              control={control}
              name="startUtc"
              rules={{ required: "Pick a time." }}
              render={({ field }) => (
                <ChipGroup
                  ariaLabel="Time"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={slotOptions}
                />
              )}
            />
          )}
        </Field>
      </SectionCard>

      <SectionCard title="Customer" contentClassName="flex flex-col gap-4">
        <Field
          id="nb-name"
          label="Name"
          error={errors.customerName?.message}
        >
          <Input
            autoComplete="name"
            {...register("customerName", { required: "Name is required." })}
          />
        </Field>
        <Field
          id="nb-phone"
          label="Phone"
          error={errors.customerPhone?.message}
        >
          <Input
            inputMode="tel"
            autoComplete="tel"
            {...register("customerPhone", { required: "Phone is required." })}
          />
        </Field>
        <Field
          id="nb-email"
          label="Email"
          hint="Optional — used for confirmation + reminders."
          error={errors.customerEmail?.message}
        >
          <Input
            type="email"
            autoComplete="email"
            {...register("customerEmail")}
          />
        </Field>
        <Field
          id="nb-notes"
          label="Notes"
          hint="Visible to staff only."
          error={errors.notes?.message}
        >
          <Textarea rows={3} {...register("notes")} />
        </Field>
      </SectionCard>

      <div className="mt-1 flex justify-end">
        <Button type="submit" size="lg" loading={pending}>
          Create booking
        </Button>
      </div>
    </form>
  );
}
