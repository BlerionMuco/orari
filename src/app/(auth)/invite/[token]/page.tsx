import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentBusiness } from "@/lib/auth/session";
import {
  getInviteByToken,
  InviteResolveKind,
} from "@/lib/invite/queries";
import { AcceptCard } from "@/components/auth/invite/accept-card";
import {
  InviteStatusCard,
  InviteStatusKind,
} from "@/components/auth/invite/invite-status-card";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { token } = await params;
  const result = await getInviteByToken(token);

  // Map resolve kinds to the read-only status card variants.
  switch (result.kind) {
    case InviteResolveKind.NOT_FOUND:
      return <InviteStatusCard kind={InviteStatusKind.NOT_FOUND} />;
    case InviteResolveKind.EXPIRED:
      return <InviteStatusCard kind={InviteStatusKind.EXPIRED} />;
    case InviteResolveKind.REVOKED:
      return <InviteStatusCard kind={InviteStatusKind.REVOKED} />;
    case InviteResolveKind.ACCEPTED:
      return <InviteStatusCard kind={InviteStatusKind.ACCEPTED} />;
    case InviteResolveKind.PENDING:
      break;
  }

  const user = await getCurrentUser();
  // V1 is locked to one business per user (product decision), so any existing
  // membership is the user's "real" business — bounce them to the dashboard
  // rather than offering a second-org accept they can't usefully complete.
  // This also handles the page-refresh-after-accept case (the invite row has
  // flipped to "accepted" and we'd otherwise show "already accepted"). If
  // multi-org membership ever ships, gate this on the invite's business_id
  // matching the existing membership instead of "has any membership".
  if (user) {
    const membership = await getCurrentBusiness(user.id);
    if (membership) {
      redirect("/dashboard");
    }
  }

  return (
    <AcceptCard
      token={token}
      businessName={result.businessName ?? "the team"}
      role={result.role ?? "staff"}
      resourceName={result.resourceName ?? null}
      email={result.email ?? ""}
      signedIn={!!user}
    />
  );
}
