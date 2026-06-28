"use client";

import { create } from "zustand";

export const ToastVariant = {
  SUCCESS: "success",
  INFO: "info",
  ERROR: "error",
} as const;
export type ToastVariant = (typeof ToastVariant)[keyof typeof ToastVariant];

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  show: (message: string, variant?: ToastVariant, durationMs?: number) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION_MS = 2400;

// One queue, one viewport, mounted once in the dashboard layout.
export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],
  show(message, variant = ToastVariant.SUCCESS, durationMs = DEFAULT_DURATION_MS) {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, variant, message }] }));
    if (durationMs > 0) {
      setTimeout(() => get().dismiss(id), durationMs);
    }
    return id;
  },
  dismiss(id) {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export function toast(message: string, variant?: ToastVariant): string {
  return useToast.getState().show(message, variant);
}
