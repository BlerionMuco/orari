import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";

// Authoritative gate for the dashboard. The proxy only refreshes the session;
// the membership check (a DB query) runs here, once per dashboard navigation.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const business = await getCurrentBusiness(user.id);
  if (!business) redirect("/onboarding");

  return <>{children}</>;
}
