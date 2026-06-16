import * as React from "react";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/buttons/button";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  // The layout already gated these, so both are present here.
  const user = await getCurrentUser();
  const business = user ? await getCurrentBusiness(user.id) : null;

  return (
    <main className="flex-1 p-6 sm:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">
              {business?.name ?? "Dashboard"}
            </h1>
            <p className="mt-1 text-[14px] text-text-muted">
              Signed in as {user?.email}
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
        <p className="text-text-muted">
          Wire calendar, staff, services, customers here.
        </p>
      </div>
    </main>
  );
}
