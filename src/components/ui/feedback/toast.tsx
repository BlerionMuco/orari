"use client";

import * as React from "react";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastVariant, useToast, type Toast } from "@/lib/ui/use-toast";

const ICON: Record<ToastVariant, typeof CheckCircle2> = {
  [ToastVariant.SUCCESS]: CheckCircle2,
  [ToastVariant.INFO]: Info,
  [ToastVariant.ERROR]: XCircle,
};

const COLOR: Record<ToastVariant, string> = {
  [ToastVariant.SUCCESS]: "text-success",
  [ToastVariant.INFO]: "text-info",
  [ToastVariant.ERROR]: "text-danger",
};

// Single mount in the dashboard layout. Listens to the Zustand queue and
// renders an aria-live region anchored bottom-center on mobile,
// bottom-right on md+.
export function ToastViewport(): React.JSX.Element {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-22 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:right-6 md:left-auto md:items-end md:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}): React.JSX.Element {
  const Icon = ICON[toast.variant];
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      role={toast.variant === ToastVariant.ERROR ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[14px] border border-border bg-surface px-4 py-3 shadow-card transition-all duration-200",
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 flex-none", COLOR[toast.variant])} aria-hidden="true" />
      <p className="flex-1 text-[14px] leading-[1.4] text-text">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-m-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-text-muted transition-colors hover:bg-fill-subtle"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
