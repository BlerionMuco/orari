import * as React from "react";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md";
export type AvatarTone = "tint" | "solid";

export interface AvatarProps {
  // Initials are derived from this; when empty + variant "placeholder", a dashed
  // empty circle is shown instead.
  name?: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  className?: string;
}

// Up to two uppercase initials from the first two words.
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const SIZE: Record<AvatarSize, string> = {
  sm: "h-8.5 w-8.5 text-[13px]",
  md: "h-11 w-11 text-[15px]",
};

const TONE: Record<AvatarTone, string> = {
  tint: "bg-primary-tint text-primary",
  solid: "bg-primary text-surface",
};

// Initials avatar. With no name it renders a dashed placeholder ring (the
// "unfilled team member" state from the design).
export function Avatar({
  name = "",
  size = "sm",
  tone = "tint",
  className,
}: AvatarProps): React.JSX.Element {
  const initials = initialsOf(name);

  if (!initials) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex flex-none items-center justify-center rounded-full border border-dashed border-border-strong bg-fill-subtle",
          SIZE[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex flex-none items-center justify-center rounded-full font-semibold",
        SIZE[size],
        TONE[tone],
        className,
      )}
    >
      {initials}
    </span>
  );
}
