"use client";

import * as React from "react";
import { AlertCircle, Lock } from "lucide-react";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";

export interface GuestDetailsValue {
  name: string;
  phone: string;
  note: string;
}

export interface GuestDetailsErrors {
  name?: string;
  phone?: string;
}

export interface GuestDetailsFieldsProps {
  value: GuestDetailsValue;
  errors: GuestDetailsErrors;
  onChange: (patch: Partial<GuestDetailsValue>) => void;
}

function ErrorRow({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="mt-[7px] flex items-center gap-1.5 text-[12.5px] text-danger-text">
      <AlertCircle
        className="h-[13px] w-[13px] flex-none text-danger"
        strokeWidth={2}
      />
      {message}
    </div>
  );
}

const labelClass = "mb-[7px] block text-[13px] font-semibold text-text";

export function GuestDetailsFields({
  value,
  errors,
  onChange,
}: GuestDetailsFieldsProps): React.JSX.Element {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="booking-name" className={labelClass}>
            Full name *
          </label>
          <Input
            id="booking-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Andi Hoxha"
            value={value.name}
            error={Boolean(errors.name)}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          {errors.name ? <ErrorRow message={errors.name} /> : null}
        </div>
        <div>
          <label htmlFor="booking-phone" className={labelClass}>
            Phone number *
          </label>
          <Input
            id="booking-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+355 69 234 5678"
            value={value.phone}
            error={Boolean(errors.phone)}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
          {errors.phone ? <ErrorRow message={errors.phone} /> : null}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="booking-note" className={labelClass}>
          Note{" "}
          <span className="font-normal text-text-disabled">· optional</span>
        </label>
        <Textarea
          id="booking-note"
          rows={3}
          placeholder="Anything the barber should know?"
          value={value.note}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </div>

      <div className="mt-4 flex items-center gap-[9px] rounded-[12px] bg-fill-subtle px-[14px] py-3">
        <Lock
          className="h-[17px] w-[17px] flex-none text-primary"
          strokeWidth={1.9}
        />
        <span className="text-[12.5px] leading-[1.4] text-text-muted">
          No account needed · You&apos;ll pay in person.
        </span>
      </div>
    </div>
  );
}
