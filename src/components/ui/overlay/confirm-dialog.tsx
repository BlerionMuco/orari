"use client";

import * as React from "react";
import { Button } from "@/components/ui/buttons/button";
import { useConfirm } from "@/lib/ui/use-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/overlay/dialog";

// Mounted once in the dashboard layout; driven by the useConfirm Zustand
// store. Any feature can call `confirmAction({ title, body, ... })` and await
// the boolean result.
export function ConfirmDialogRoot(): React.JSX.Element {
  const request = useConfirm((s) => s.request);
  const resolve = useConfirm((s) => s.resolve);
  const open = request !== null;
  const handleOpenChange = (next: boolean): void => {
    if (!next && open) resolve(false);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <DialogTitle>{request?.title ?? ""}</DialogTitle>
          {request?.body ? <DialogDescription>{request.body}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => resolve(false)}>
            {request?.cancelLabel ?? "Cancel"}
          </Button>
          <Button
            variant={request?.danger ? "danger" : "primary"}
            onClick={() => resolve(true)}
          >
            {request?.confirmLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
