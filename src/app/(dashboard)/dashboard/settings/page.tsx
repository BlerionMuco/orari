import * as React from "react";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/nav/page-header";
import { SettingsMenu } from "@/components/dashboard/settings/settings-menu";

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsMenu role={business.role} />
    </>
  );
}
