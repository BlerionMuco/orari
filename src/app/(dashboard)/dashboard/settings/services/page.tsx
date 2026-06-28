import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import { listServices } from "@/lib/services/queries";
import { Button } from "@/components/ui/buttons/button";
import { EmptyListState } from "@/components/ui/display/empty-list-state";
import { PageHeader } from "@/components/ui/nav/page-header";
import { ServiceList } from "@/components/dashboard/services/service-list";

export default async function ServicesPage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  if (business.role !== "owner") redirect("/dashboard/restricted");

  const scope = businessScope(business.id);
  const services = await listServices(scope);

  return (
    <>
      <PageHeader
        title="Services"
        backHref="/dashboard/settings"
        trailing={
          <Button asChild size="sm">
            <Link href="/dashboard/settings/services/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add
            </Link>
          </Button>
        }
      />
      {services.length === 0 ? (
        <EmptyListState
          icon="inbox"
          title="Add your first service"
          body="Services are what customers pick when they book."
          action={
            <Button asChild>
              <Link href="/dashboard/settings/services/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add service
              </Link>
            </Button>
          }
        />
      ) : (
        <ServiceList services={services} currency={business.currency} />
      )}
    </>
  );
}
