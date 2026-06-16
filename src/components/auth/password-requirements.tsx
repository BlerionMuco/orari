import * as React from "react";
import { Check } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/schemas/auth";
import { cn } from "@/lib/utils";

export interface PasswordRequirementsProps {
  value: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordRequirements({
  value,
}: PasswordRequirementsProps): React.JSX.Element {
  const requirements: Requirement[] = [
    { label: "At least 8 characters", met: PASSWORD_RULES.minLength(value) },
    { label: "One uppercase letter", met: PASSWORD_RULES.uppercase(value) },
    { label: "One number", met: PASSWORD_RULES.number(value) },
  ];

  return (
    <ul className="flex flex-col gap-2.5">
      {requirements.map((requirement) => (
        <li
          key={requirement.label}
          className={cn(
            "flex items-center gap-[9px] text-[13px]",
            requirement.met ? "text-text" : "text-text-muted",
          )}
        >
          {requirement.met ? (
            <span className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-success-bg text-success-text">
              <Check className="h-[11px] w-[11px]" strokeWidth={3} aria-hidden="true" />
            </span>
          ) : (
            <span
              className="h-[18px] w-[18px] flex-none rounded-full border-[1.5px] border-border-strong bg-surface"
              aria-hidden="true"
            />
          )}
          {requirement.label}
        </li>
      ))}
    </ul>
  );
}
