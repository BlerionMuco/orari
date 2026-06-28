import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/nav/page-header";
import { getBusinessDefaultRules } from "@/lib/booking-rules/queries";
import { RulesForm } from "@/components/dashboard/booking-rules/rules-form";
import {
  SLOT_GRANULARITY_OPTIONS,
  type SlotGranularity,
} from "@/lib/schemas/booking-rules";

export default async function BookingRulesPage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  if (business.role !== "owner") redirect("/dashboard/restricted");

  const rules = await getBusinessDefaultRules(business.id);
  // Coerce the stored value to the nearest allowed granularity so the form's
  // narrowed union type holds even if the DB has a legacy value.
  const granularity: SlotGranularity =
    (SLOT_GRANULARITY_OPTIONS as readonly number[]).includes(
      rules.slotGranularityMin,
    )
      ? (rules.slotGranularityMin as SlotGranularity)
      : 15;

  return (
    <>
      <PageHeader title="Booking rules" backHref="/dashboard/settings" />
      <RulesForm
        initial={{
          leadTimeHours: Math.round(rules.leadTimeMin / 60),
          advanceWindowDays: rules.advanceWindowDays,
          slotGranularityMin: granularity,
        }}
      />
    </>
  );
}
