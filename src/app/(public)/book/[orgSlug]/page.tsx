import * as React from "react";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getBusinessBySlug,
  listActiveServices,
  listActiveResources,
} from "@/lib/booking/queries";
import { BookingWizardProvider } from "@/components/booking/wizard/booking-wizard-store";
import { BookingWizard } from "@/components/booking/wizard/booking-wizard";
import { EmptyBusiness } from "@/components/booking/states/empty-business";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

// Module-scope cache: the page and generateMetadata share one request-level
// lookup instead of querying twice.
const loadBusiness = cache(getBusinessBySlug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orgSlug } = await params;
  const business = await loadBusiness(orgSlug);
  return { title: business ? `Book — ${business.name}` : "Book" };
}

export default async function PublicBookingPage({
  params,
}: Props): Promise<React.JSX.Element> {
  const { orgSlug } = await params;
  const business = await loadBusiness(orgSlug);
  if (!business) notFound();

  const [services, resources] = await Promise.all([
    listActiveServices(business.id),
    listActiveResources(business.id),
  ]);

  if (services.length === 0) {
    return <EmptyBusiness business={business} />;
  }

  return (
    <BookingWizardProvider
      business={business}
      services={services}
      resources={resources}
    >
      <BookingWizard />
    </BookingWizardProvider>
  );
}
