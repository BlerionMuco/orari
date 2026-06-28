import * as React from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/nav/page-header";
import { AccountForm } from "@/components/dashboard/account/account-form";
import { ChangePasswordForm } from "@/components/dashboard/account/change-password-form";
import { SignOutCard } from "@/components/dashboard/account/sign-out-card";

export default async function AccountPage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const [profile] = await db
    .select({ fullName: profiles.fullName, email: profiles.email })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return (
    <>
      <PageHeader title="Account" backHref="/dashboard/settings" />
      <div className="flex flex-col gap-3">
        <AccountForm
          initial={{
            fullName: profile?.fullName ?? "",
            email: profile?.email ?? user.email ?? "",
          }}
        />
        <ChangePasswordForm />
        <SignOutCard />
      </div>
    </>
  );
}
