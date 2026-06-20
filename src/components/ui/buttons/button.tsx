"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[11px] font-medium cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-surface font-semibold hover:bg-primary-hover active:bg-primary-pressed",
        secondary:
          "bg-primary-tint text-primary-pressed hover:bg-primary-tint-hover",
        outline:
          "bg-surface border border-border text-text hover:border-border-strong hover:bg-bg",
        danger:
          "bg-surface border border-danger text-danger-text hover:bg-danger-bg",
        ghost: "bg-transparent text-text-muted hover:bg-fill-subtle",
      },
      size: {
        lg: "h-13 rounded-[14px] px-5 text-[16px]",
        md: "h-11.5 px-4 text-[15px]",
        sm: "h-9 px-3 text-[13.5px]",
        icon: "h-11 w-11",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  const Comp = asChild ? Slot : "button";
  // Slot requires a single child element, so the loading spinner is only
  // rendered for real <button> usage (asChild links never pass `loading`).
  const content =
    loading && !asChild ? (
      <>
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        {children}
      </>
    ) : (
      children
    );
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={asChild ? undefined : disabled || loading}
      {...props}
    >
      {content}
    </Comp>
  );
}

export { buttonVariants };
