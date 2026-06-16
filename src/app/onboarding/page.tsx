import * as React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { OnboardingWizard } from "@/app/onboarding/onboarding-wizard";

export const metadata: Metadata = {
  title: "Set up your business — Orari",
};

// Lives outside the (dashboard) group so it doesn't inherit the membership gate.
// Symmetric with that gate: no user → sign-in; already has a business → dashboard
// (prevents a redirect loop and a second-business mint).
export default async function OnboardingPage(): Promise<React.JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const business = await getCurrentBusiness(user.id);
  if (business) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-bg px-4 py-10 sm:py-16">
      <OnboardingWizard />
    </main>
  );
}
