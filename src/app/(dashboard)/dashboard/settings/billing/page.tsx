import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/nav/page-header";
import { getSubscriptionState } from "@/lib/billing/queries";
import { TrialStatusCard } from "@/components/dashboard/billing/trial-status-card";
import { PlanStub } from "@/components/dashboard/billing/plan-stub";
import { ComingSoonCard } from "@/components/dashboard/billing/coming-soon-card";

export default async function BillingPage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  if (business.role !== "owner") redirect("/dashboard/restricted");

  const state = await getSubscriptionState(business.id);

  return (
    <>
      <PageHeader title="Billing" backHref="/dashboard/settings" />
      <div className="flex flex-col gap-3">
        <TrialStatusCard
          status={state.status}
          trialEndsAt={state.trialEndsAt}
          trialDaysLeft={state.trialDaysLeft}
          trialActive={state.trialActive}
          trialEnded={state.trialEnded}
        />
        <PlanStub />
        <ComingSoonCard />
      </div>
    </>
  );
}
