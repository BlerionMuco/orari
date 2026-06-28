"use client";

import { create } from "zustand";

export interface ConfirmPayload {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmPayload {
  resolve: (accepted: boolean) => void;
}

interface ConfirmStore {
  request: ConfirmRequest | null;
  confirm: (payload: ConfirmPayload) => Promise<boolean>;
  resolve: (accepted: boolean) => void;
}

// One pending request at a time; the dialog mounted once in the dashboard
// layout reads `request` and calls `resolve` on click.
export const useConfirm = create<ConfirmStore>((set, get) => ({
  request: null,
  confirm(payload) {
    return new Promise<boolean>((resolve) => {
      set({ request: { ...payload, resolve } });
    });
  },
  resolve(accepted) {
    const current = get().request;
    if (!current) return;
    current.resolve(accepted);
    set({ request: null });
  },
}));

export function confirmAction(payload: ConfirmPayload): Promise<boolean> {
  return useConfirm.getState().confirm(payload);
}
