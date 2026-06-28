import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import {
  ScreenState,
  ScreenStateKind,
  ScreenStateIcon,
} from "@/components/ui/feedback/screen-state";

export const InviteStatusKind = {
  NOT_FOUND: "not_found",
  EXPIRED: "expired",
  ACCEPTED: "accepted",
  REVOKED: "revoked",
} as const;
export type InviteStatusKind =
  (typeof InviteStatusKind)[keyof typeof InviteStatusKind];

const COPY: Record<InviteStatusKind, { title: string; body: string }> = {
  not_found: {
    title: "Invite not found",
    body: "This invite link doesn't match any pending invite. Ask the owner to send a new one.",
  },
  expired: {
    title: "Invite expired",
    body: "This invite link has expired. Ask the owner to resend it.",
  },
  accepted: {
    title: "Already accepted",
    body: "This invite has already been used. Sign in to continue.",
  },
  revoked: {
    title: "Invite revoked",
    body: "This invite link is no longer active. Ask the owner for a new one.",
  },
};

export interface InviteStatusCardProps {
  kind: InviteStatusKind;
}

// Read-only end-state for non-pending invites. Mirrors ScreenState's vocab
// (empty/error) so the invite page keeps a single visual language.
export function InviteStatusCard({
  kind,
}: InviteStatusCardProps): React.JSX.Element {
  const { title, body } = COPY[kind];
  const ctaLabel = kind === InviteStatusKind.ACCEPTED ? "Sign in" : "Go home";
  const ctaHref = kind === InviteStatusKind.ACCEPTED ? "/sign-in" : "/";
  const screenKind: ScreenStateKind =
    kind === InviteStatusKind.NOT_FOUND
      ? ScreenStateKind.ERROR
      : ScreenStateKind.EMPTY;
  return (
    <ScreenState
      kind={screenKind}
      icon={ScreenStateIcon.ALERT}
      title={title}
      body={body}
      action={
        <Button asChild variant="outline" size="sm">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      }
    />
  );
}
