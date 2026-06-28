import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/nav/page-header";
import { getReminderSettings } from "@/lib/reminders/queries";
import { timingFromOffsets } from "@/lib/schemas/reminders";
import { RemindersForm } from "@/components/dashboard/reminders/reminders-form";

export default async function RemindersPage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  if (business.role !== "owner") redirect("/dashboard/restricted");

  const settings = await getReminderSettings(business.id);

  return (
    <>
      <PageHeader title="Reminders" backHref="/dashboard/settings" />
      <RemindersForm
        initial={{
          enabled: settings.enabled,
          timing: timingFromOffsets(settings.offsetsMin),
        }}
      />
    </>
  );
}
