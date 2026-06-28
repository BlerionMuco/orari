"use client";

import * as React from "react";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { useConfirm } from "@/lib/ui/use-confirm";
import { signOut } from "@/lib/auth/actions";

export function SignOutCard(): React.JSX.Element {
  const confirm = useConfirm((s) => s.confirm);
  const [pending, startTransition] = React.useTransition();

  const onClick = async (): Promise<void> => {
    const ok = await confirm({
      title: "Sign out?",
      body: "You'll need to sign back in to access the dashboard.",
      confirmLabel: "Sign out",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <SectionCard contentClassName="flex flex-col gap-2">
      <p className="text-[13px] text-text-muted">
        Signed in on this device.
      </p>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onClick}
          loading={pending}
        >
          Sign out
        </Button>
      </div>
    </SectionCard>
  );
}
