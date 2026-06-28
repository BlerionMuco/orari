"use client";

import * as React from "react";
import { Mail, RefreshCw, Trash2 } from "lucide-react";
import { LabeledRow } from "@/components/ui/form/labeled-row";
import { Button } from "@/components/ui/buttons/button";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { useConfirm } from "@/lib/ui/use-confirm";
import {
  resendInviteAction,
  revokeInviteAction,
} from "@/lib/team/actions";
import type { PendingInvite } from "@/lib/team/queries";

export interface PendingInviteCardProps {
  invite: PendingInvite;
}

function expiryLabel(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days === 1) return "Expires in 1 day";
  return `Expires in ${days} days`;
}

export function PendingInviteCard({
  invite,
}: PendingInviteCardProps): React.JSX.Element {
  const show = useToast((s) => s.show);
  const confirm = useConfirm((s) => s.confirm);
  const [pending, startTransition] = React.useTransition();

  const onResend = (): void => {
    startTransition(async () => {
      const res = await resendInviteAction({ inviteId: invite.id });
      if (!res.ok) {
        show(res.error ?? "Couldn't resend.", ToastVariant.ERROR);
        return;
      }
      if (res.invitePath) {
        const url = `${window.location.origin}${res.invitePath}`;
        try {
          await navigator.clipboard.writeText(url);
          show("Invite link copied to clipboard");
        } catch {
          show(`Invite link: ${url}`, ToastVariant.INFO);
        }
      } else {
        show("Invite link refreshed");
      }
    });
  };

  const onRevoke = async (): Promise<void> => {
    const ok = await confirm({
      title: "Revoke invite?",
      body: `${invite.email} won't be able to join with the current link.`,
      confirmLabel: "Revoke",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await revokeInviteAction({ inviteId: invite.id });
      if (!res.ok) {
        show(res.error ?? "Couldn't revoke.", ToastVariant.ERROR);
        return;
      }
      show("Invite revoked");
    });
  };

  return (
    <LabeledRow
      title={invite.email}
      subtitle={expiryLabel(invite.expiresAt)}
      leading={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-fill-subtle text-text-muted">
          <Mail className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
      }
      trailing={
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResend}
            disabled={pending}
            aria-label="Resend invite"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRevoke}
            disabled={pending}
            aria-label="Revoke invite"
            className="text-danger-text"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      }
    />
  );
}
