import * as React from "react";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/nav/page-header";
import { getBusinessProfile } from "@/lib/businesses/queries";
import { ProfileForm } from "@/components/dashboard/profile/profile-form";

export default async function ProfilePage(): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  if (business.role !== "owner") redirect("/dashboard/restricted");

  const profile = await getBusinessProfile(business.id);
  if (!profile) notFound();

  // Derive the public URL base from the request — no env var needed and it
  // tracks whatever host the operator is using right now (local, preview, prod).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const publicUrlBase = host ? `${proto}://${host}/book` : "/book";

  return (
    <>
      <PageHeader title="Business profile" backHref="/dashboard/settings" />
      <ProfileForm
        publicUrlBase={publicUrlBase}
        initial={{
          name: profile.name,
          slug: profile.slug,
          phone: profile.phone ?? "",
          description: profile.description ?? "",
          logoUrl: profile.logoUrl ?? "",
          currency: profile.currency,
          location: profile.location ?? null,
        }}
      />
    </>
  );
}
