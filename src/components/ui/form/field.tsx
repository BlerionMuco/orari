import * as React from "react";
import { Label } from "@/components/ui/form/label";
import { cn } from "@/lib/utils";

// Props the Field injects into its single input child so the label and
// helper/error text stay wired together for assistive tech.
type FieldChildProps = {
  id?: string;
  error?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactElement<FieldChildProps>;
}

export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FieldProps): React.JSX.Element {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = React.cloneElement(children, {
    id,
    error: Boolean(error),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
  });

  return (
    <div className={cn("flex flex-col gap-1.75", className)}>
      <Label htmlFor={id}>{label}</Label>
      {control}
      {error ? (
        <p id={errorId} className="text-[13px] text-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[13px] text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
