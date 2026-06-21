import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type AddButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

// Dashed "add another" button (services, team members). Defaults to type="button"
// so it never submits the wizard form; callers can override.
export function AddButton({
  className,
  children,
  ...props
}: AddButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed border-border-strong",
        "text-[14px] font-medium text-primary transition-colors",
        "hover:border-primary hover:bg-primary-tint/40",
        "focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus",
        className,
      )}
      {...props}
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}
