"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/media/avatar";
import { LabeledRow } from "@/components/ui/form/labeled-row";
import { Switch } from "@/components/ui/form/switch";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { setResourceActiveAction } from "@/lib/team/actions";
import type { TeamMember } from "@/lib/team/queries";

export interface MemberCardProps {
  member: TeamMember;
}

// Resource row on the Team page. Login pill flags whether the staffer has
// accepted their invite (resources.user_id IS NOT NULL). The active toggle
// commits via setResourceActiveAction; useOptimistic carries the pending
// value until router.refresh() rehydrates the SSR list (or the action
// errors and the optimistic override clears).
export function MemberCard({ member }: MemberCardProps): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const show = useToast((s) => s.show);
  const [optimisticActive, setOptimisticActive] = React.useOptimistic(member.active);

  const onToggle = (next: boolean): void => {
    startTransition(async () => {
      setOptimisticActive(next);
      const res = await setResourceActiveAction({
        resourceId: member.id,
        active: next,
      });
      if (!res.ok) {
        show(res.error ?? "Couldn't update.", ToastVariant.ERROR);
        return;
      }
      router.refresh();
    });
  };
  const active = optimisticActive;

  return (
    <LabeledRow
      title={member.name}
      subtitle={member.loginLinked ? "Manages their own schedule" : "Bookable resource"}
      leading={<Avatar name={member.name} size="md" />}
      trailing={
        <div className="flex items-center gap-3">
          <LoginPill linked={member.loginLinked} />
          <Switch
            checked={active}
            disabled={pending}
            onCheckedChange={onToggle}
            aria-label={`${active ? "Deactivate" : "Activate"} ${member.name}`}
          />
        </div>
      }
      dim={!active}
    />
  );
}

function LoginPill({ linked }: { linked: boolean }): React.JSX.Element {
  return (
    <span
      className={
        linked
          ? "inline-flex h-5.5 items-center rounded-full bg-success-bg px-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-success-text"
          : "inline-flex h-5.5 items-center rounded-full bg-fill-subtle px-2 text-[10px] font-semibold uppercase tracking-[0.04em] text-text-disabled"
      }
    >
      {linked ? "Login" : "No login"}
    </span>
  );
}
