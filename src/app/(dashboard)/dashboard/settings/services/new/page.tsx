import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/nav/page-header";
import { ServiceForm } from "@/components/dashboard/services/service-form";

export default async function NewServicePage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  if (business.role !== "owner") redirect("/dashboard/restricted");

  return (
    <>
      <PageHeader title="New service" backHref="/dashboard/settings/services" />
      <ServiceForm
        mode="new"
        defaultValues={{
          name: "",
          durationMin: 30,
          price: 0,
          beforeBufferMin: 5,
          afterBufferMin: 0,
          active: true,
        }}
      />
    </>
  );
}
