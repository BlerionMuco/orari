"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/buttons/button";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { acceptInviteAction } from "@/app/(auth)/invite/[token]/actions";

export interface AcceptCardProps {
  token: string;
  businessName: string;
  role: string;
  resourceName: string | null;
  email: string;
  signedIn: boolean;
}

function roleLabel(role: string): string {
  if (role === "owner") return "owner";
  return "barber";
}

export function AcceptCard({
  token,
  businessName,
  role,
  resourceName,
  email,
  signedIn,
}: AcceptCardProps): React.JSX.Element {
  const router = useRouter();
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();

  const onAccept = (): void => {
    startTransition(async () => {
      const res = await acceptInviteAction(token);
      if (!res.ok) {
        show(res.error ?? "Couldn't accept the invite.", ToastVariant.ERROR);
        return;
      }
      show(`Welcome to ${businessName}`);
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1.5 text-center">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-text-muted">
          Invite
        </p>
        <h1 className="text-[19px] font-semibold text-text">
          Join {businessName}
        </h1>
        <p className="text-[13.5px] leading-[1.45] text-text-muted">
          You&apos;ve been invited as a {roleLabel(role)}
          {resourceName ? ` on ${resourceName}` : ""}. Sent to {email}.
        </p>
      </header>

      {signedIn ? (
        <Button size="lg" block onClick={onAccept} loading={pending}>
          Accept invite
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-center text-[13px] text-text-muted">
            Sign in or create an account to accept.
          </p>
          <Button variant="primary" size="lg" block asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button variant="outline" size="lg" block asChild>
            <Link href="/sign-up">Create an account</Link>
          </Button>
          <p className="mt-1 text-center text-[12px] text-text-muted">
            Re-open this invite link after signing in.
          </p>
        </div>
      )}
    </div>
  );
}
