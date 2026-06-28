import * as React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import { getServiceById } from "@/lib/services/queries";
import { PageHeader } from "@/components/ui/nav/page-header";
import { ServiceForm } from "@/components/dashboard/services/service-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  if (business.role !== "owner") redirect("/dashboard/restricted");

  const scope = businessScope(business.id);
  const service = await getServiceById(scope, id);
  if (!service) notFound();

  return (
    <>
      <PageHeader title="Edit service" backHref="/dashboard/settings/services" />
      <ServiceForm
        mode="edit"
        serviceId={service.id}
        defaultValues={{
          name: service.name,
          durationMin: service.durationMin,
          price: service.priceCents,
          beforeBufferMin: service.beforeBufferMin,
          afterBufferMin: service.afterBufferMin,
          active: service.active,
        }}
      />
    </>
  );
}
