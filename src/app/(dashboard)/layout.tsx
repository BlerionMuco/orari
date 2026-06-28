import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { ToastViewport } from "@/components/ui/feedback/toast";
import { ConfirmDialogRoot } from "@/components/ui/overlay/confirm-dialog";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";

// Authoritative gate for the dashboard. The proxy only refreshes the session;
// the membership check (a DB query) runs here, once per dashboard navigation.
// Shell (sidebar + bottom tabs) wraps every dashboard route. Toast + confirm
// roots mount once so any page can drive them via the Zustand stores.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const business = await getCurrentBusiness(user.id);
  if (!business) redirect("/onboarding");

  return (
    <>
      <DashboardShell businessName={business.name}>{children}</DashboardShell>
      <ToastViewport />
      <ConfirmDialogRoot />
    </>
  );
}
