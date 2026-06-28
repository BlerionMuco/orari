"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/overlay/dialog";

// Bottom-sheet on mobile, right-drawer on md+. Used for the invite form and
// any other primary action panel that would crowd a phone screen.
export const Sheet = Dialog;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogClose;
export { DialogTitle as SheetTitle, DialogDescription as SheetDescription };

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "bottom" | "right";
  }
>(function SheetContent({ className, children, side = "bottom", ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 bg-surface shadow-card focus:outline-hidden",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[90vh] rounded-t-[20px] border-t border-border p-5",
          side === "bottom" && "md:inset-x-auto md:left-auto md:right-0 md:top-0 md:bottom-0",
          side === "bottom" && "md:max-h-none md:h-full md:w-96 md:max-w-md md:rounded-none md:border-l md:border-t-0",
          side === "right" && "right-0 top-0 bottom-0 w-full max-w-md border-l border-border p-5",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-fill-subtle"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return <div className={cn("mb-4 flex flex-col gap-1 pr-8", className)} {...props} />;
}

export function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div
      className={cn("mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
