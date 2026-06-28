import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import { listPendingInvites, listTeam } from "@/lib/team/queries";
import { PageHeader } from "@/components/ui/nav/page-header";
import { SectionCard } from "@/components/ui/display/section-card";
import { EmptyListState } from "@/components/ui/display/empty-list-state";
import { MemberCard } from "@/components/dashboard/team/member-card";
import { PendingInviteCard } from "@/components/dashboard/team/pending-invite-card";
import { InviteForm } from "@/components/dashboard/team/invite-form";

export default async function TeamPage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  if (business.role !== "owner") redirect("/dashboard/restricted");

  const scope = businessScope(business.id);
  const [members, pending] = await Promise.all([
    listTeam(scope),
    listPendingInvites(scope),
  ]);

  return (
    <>
      <PageHeader
        title="Team & resources"
        backHref="/dashboard/settings"
        trailing={<InviteForm />}
      />
      {members.length === 0 ? (
        <EmptyListState
          title="Add your first team member"
          body="Each barber, chair, or room is a bookable resource. Invite them so they can manage their own schedule."
        />
      ) : (
        <SectionCard title="Resources" contentClassName="flex flex-col gap-2">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </SectionCard>
      )}
      {pending.length > 0 ? (
        <SectionCard
          title="Pending invites"
          description="Until accepted, the resource is bookable but the person can't log in."
          contentClassName="flex flex-col gap-2"
          className="mt-3"
        >
          {pending.map((invite) => (
            <PendingInviteCard key={invite.id} invite={invite} />
          ))}
        </SectionCard>
      ) : null}
    </>
  );
}
