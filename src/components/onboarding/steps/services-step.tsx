"use client";

import * as React from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { OnboardingInput } from "@/lib/schemas/onboarding";
import { StepShell } from "@/components/ui/wizard/step-shell";
import { Input } from "@/components/ui/form/input";
import { Label } from "@/components/ui/form/label";
import { AddButton } from "@/components/ui/buttons/add-button";
import { formatPrice } from "@/lib/booking/slots-view";

function priceRangeLabel(prices: number[]): string {
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? formatPrice(min, "ALL")
    : `${formatPrice(min, "ALL")} – ${formatPrice(max, "ALL")}`;
}

export function ServicesStep(): React.JSX.Element {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<OnboardingInput>();
  const { fields, append, remove } = useFieldArray({ control, name: "services" });
  const services = useWatch({ control, name: "services" }) ?? [];

  const readyPrices = services
    .filter(
      (s) =>
        s &&
        s.name?.trim().length > 0 &&
        Number.isFinite(s.durationMin) &&
        Number.isFinite(s.price),
    )
    .map((s) => s.price);

  return (
    <StepShell
      title="What do you offer?"
      subtitle="Add the services customers can book. Buffers between appointments are configured later in the dashboard."
    >
      <div className="flex flex-col gap-3">
        {fields.map((row, i) => {
          const rowErr = errors.services?.[i];
          return (
            <div
              key={row.id}
              className="rounded-[15px] border border-border bg-surface p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-[7px] bg-primary-tint text-[12px] font-semibold text-primary">
                  {i + 1}
                </span>
                <Input
                  className="flex-1"
                  placeholder="Service name"
                  aria-label={`Service ${i + 1} name`}
                  error={Boolean(rowErr?.name)}
                  {...register(`services.${i}.name`)}
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={fields.length <= 1}
                  aria-label={`Remove service ${i + 1}`}
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] text-text-muted transition-colors hover:enabled:border-danger hover:enabled:text-danger disabled:cursor-not-allowed disabled:text-text-disabled focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`svc-${i}-dur`}>Duration</Label>
                  <div className="relative">
                    <Input
                      id={`svc-${i}-dur`}
                      inputMode="numeric"
                      placeholder="30"
                      className="pr-12"
                      error={Boolean(rowErr?.durationMin)}
                      {...register(`services.${i}.durationMin`, {
                        valueAsNumber: true,
                      })}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-text-disabled">
                      min
                    </span>
                  </div>
                  {rowErr?.durationMin ? (
                    <p className="text-[12px] text-danger-text">
                      {rowErr.durationMin.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor={`svc-${i}-price`}>Price</Label>
                  <div className="relative">
                    <Input
                      id={`svc-${i}-price`}
                      inputMode="numeric"
                      placeholder="800"
                      className="pr-12"
                      error={Boolean(rowErr?.price)}
                      {...register(`services.${i}.price`, {
                        valueAsNumber: true,
                      })}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-text-disabled">
                      Lek
                    </span>
                  </div>
                  {rowErr?.price ? (
                    <p className="text-[12px] text-danger-text">
                      {rowErr.price.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        <AddButton onClick={() => append({ name: "", durationMin: 30, price: 0 })}>
          Add service
        </AddButton>

        {readyPrices.length > 0 ? (
          <div className="flex items-center justify-between rounded-[13px] bg-primary-tint px-4 py-3 text-[13px] font-semibold text-primary-pressed">
            <span>
              {readyPrices.length} service{readyPrices.length > 1 ? "s" : ""} ready
            </span>
            <span className="tabular-nums">{priceRangeLabel(readyPrices)}</span>
          </div>
        ) : null}
      </div>
    </StepShell>
  );
}
