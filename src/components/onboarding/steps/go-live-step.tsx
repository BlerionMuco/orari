"use client";

import * as React from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { OnboardingInput, SlugStatus } from "@/lib/schemas/onboarding";
import { StepShell } from "@/components/ui/wizard/step-shell";
import { Label } from "@/components/ui/form/label";
import { Avatar } from "@/components/ui/media/avatar";
import { bookingDisplay, bookingHost } from "../constants";
import { cn } from "@/lib/utils";

const STATUS_MESSAGE: Record<SlugStatus, string> = {
  idle: "",
  checking: "Checking availability…",
  available: "Nice — this link is available.",
  taken: "That link is taken — pick another.",
  invalid: "Use 3–40 lowercase letters, numbers and single hyphens.",
  reserved: "That word is reserved — try something else.",
};

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function StatusIcon({ status }: { status: SlugStatus }): React.JSX.Element | null {
  if (status === "checking") {
    return (
      <LoaderCircle
        className="h-5 w-5 flex-none animate-spin text-text-muted"
        aria-hidden="true"
      />
    );
  }
  if (status === "available") {
    return (
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success-bg">
        <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
      </span>
    );
  }
  if (status === "taken" || status === "invalid" || status === "reserved") {
    return (
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-danger-bg">
        <X className="h-3.5 w-3.5 text-danger" aria-hidden="true" />
      </span>
    );
  }
  return null;
}

function RecapRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3",
        !last && "border-b border-border",
      )}
    >
      <span className="text-[13px] text-text-muted">{label}</span>
      <span className="text-[13px] font-medium text-text">{value}</span>
    </div>
  );
}

export interface GoLiveStepProps {
  slugStatus: SlugStatus;
}

export function GoLiveStep({ slugStatus }: GoLiveStepProps): React.JSX.Element {
  const { control } = useFormContext<OnboardingInput>();
  const slug = useWatch({ control, name: "slug" }) ?? "";
  const name = useWatch({ control, name: "name" }) ?? "";
  const services = useWatch({ control, name: "services" }) ?? [];
  const hours = useWatch({ control, name: "hours" }) ?? [];
  const ownerIsResource = useWatch({ control, name: "ownerIsResource" }) ?? false;
  const team = useWatch({ control, name: "team" }) ?? [];

  const serviceCount = services.filter((s) => s?.name?.trim().length > 0).length;
  const openDays = hours.filter((d) => d?.open).length;
  const hoursSummary =
    openDays === 0
      ? "Closed all week"
      : `${openDays} day${openDays > 1 ? "s" : ""} a week`;
  const bookable =
    (ownerIsResource ? 1 : 0) +
    team.filter((m) => m?.name?.trim().length > 0).length;

  const prefix = `${bookingHost().replace(/^https?:\/\//, "")}/book/`;
  const isError =
    slugStatus === "taken" ||
    slugStatus === "invalid" ||
    slugStatus === "reserved";

  return (
    <StepShell
      title="Pick your booking link"
      subtitle="This is the permanent public URL customers use to book. Choose carefully — it can't be changed later."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.75">
          <Label htmlFor="slug">Booking link</Label>
          <div
            className={cn(
              "flex h-13 items-center gap-1 rounded-[13px] border bg-surface px-3.5",
              slugStatus === "available"
                ? "border-success"
                : isError
                  ? "border-danger"
                  : "border-border",
            )}
          >
            <span className="flex-none text-[14px] text-text-muted">{prefix}</span>
            <Controller
              control={control}
              name="slug"
              render={({ field }) => (
                <input
                  id="slug"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(sanitizeSlug(e.target.value))}
                  onBlur={field.onBlur}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoComplete="off"
                  placeholder="your-shop"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-text outline-hidden placeholder:text-text-disabled"
                />
              )}
            />
            <StatusIcon status={slugStatus} />
          </div>
          <p
            className={cn(
              "min-h-[18px] text-[13px]",
              slugStatus === "available"
                ? "text-success-text"
                : isError
                  ? "text-danger-text"
                  : "text-text-muted",
            )}
          >
            {STATUS_MESSAGE[slugStatus]}
          </p>
        </div>

        {/* Public-page preview */}
        <div className="rounded-[14px] border border-border bg-surface p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-disabled">
            Your public page
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-text">
                {name || "Your business"}
              </p>
              <p className="truncate text-[13px] text-primary">
                {bookingDisplay(slug || "your-shop")}
              </p>
            </div>
          </div>
        </div>

        {/* Recap */}
        <div className="rounded-[14px] border border-border bg-surface">
          <RecapRow
            label="Services"
            value={`${serviceCount} service${serviceCount === 1 ? "" : "s"}`}
          />
          <RecapRow label="Open" value={hoursSummary} />
          <RecapRow
            label="Bookable"
            value={`${bookable} ${bookable === 1 ? "person" : "people"}`}
            last
          />
        </div>
      </div>
    </StepShell>
  );
}
