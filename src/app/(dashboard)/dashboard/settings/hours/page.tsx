import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { businessScope } from "@/lib/db/scoped";
import {
  getResourceForUser,
  listActiveResources,
} from "@/lib/booking/queries";
import {
  getEditableResource,
  getWorkingHours,
} from "@/lib/hours/queries";
import { PageHeader } from "@/components/ui/nav/page-header";
import { ScreenState } from "@/components/ui/feedback/screen-state";
import { ResourcePicker } from "@/components/dashboard/hours/resource-picker";
import { HoursEditor } from "@/components/dashboard/hours/hours-editor";

interface HoursSearchParams {
  resource?: string | string[];
}

function pickOne(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HoursPage({
  searchParams,
}: {
  searchParams: Promise<HoursSearchParams>;
}): Promise<React.JSX.Element> {
  const user = (await getCurrentUser())!;
  const business = (await getCurrentBusiness(user.id))!;
  const scope = businessScope(business.id);

  // Owner: pick any active resource via the chip filter. Staff: locked to
  // their own resource, no picker; bounce to /restricted if they own none.
  let resourceId: string;
  let resourceName: string;
  let ownerResources: { id: string; name: string }[] = [];

  if (business.role === "staff") {
    const own = await getResourceForUser(scope, user.id);
    if (!own) redirect("/dashboard/restricted");
    resourceId = own.id;
    resourceName = own.name;
  } else {
    ownerResources = await listActiveResources(business.id);
    const requested = pickOne((await searchParams).resource);
    const target =
      requested && ownerResources.some((r) => r.id === requested)
        ? requested
        : ownerResources[0]?.id;
    if (!target) {
      return (
        <>
          <PageHeader
            title="Working hours"
            backHref="/dashboard/settings"
          />
          <div className="rounded-[18px] border border-border bg-surface">
            <ScreenState
              kind="empty"
              icon="calendar"
              title="No resources yet"
              body="Add a team member or activate yourself as a resource to set hours."
            />
          </div>
        </>
      );
    }
    const editable = await getEditableResource(scope, target);
    if (!editable) redirect("/dashboard/settings/hours");
    resourceId = editable.id;
    resourceName = editable.name;
  }

  const hours = await getWorkingHours(scope, resourceId);
  const isOwner = business.role === "owner";

  return (
    <>
      <PageHeader
        title={isOwner ? "Working hours" : "My hours"}
        backHref="/dashboard/settings"
      />
      {isOwner ? (
        <div className="mb-4">
          <ResourcePicker
            resources={ownerResources}
            selectedResourceId={resourceId}
          />
        </div>
      ) : (
        <p className="mb-4 text-[13px] text-text-muted">
          Weekly schedule for <span className="font-semibold text-text">{resourceName}</span>.
        </p>
      )}
      <HoursEditor key={resourceId} resourceId={resourceId} initialHours={hours} />
    </>
  );
}
