"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import { formatPrice } from "@/lib/booking/slots-view";
import { LabeledRow } from "@/components/ui/form/labeled-row";
import { Switch } from "@/components/ui/form/switch";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { setServiceActiveAction } from "@/lib/services/actions";
import type { Service } from "@/db/schema";

export interface ServiceListProps {
  services: Service[];
  currency: string;
}

// Service rows with inline active-toggle. The toggle commits immediately via a
// server action; on failure we revert and toast. Source of truth is the prop;
// useOptimistic shows the pending value until router.refresh() pulls the new
// row in from the server (or the action errors and the override clears).
export function ServiceList({
  services,
  currency,
}: ServiceListProps): React.JSX.Element {
  return (
    <ul className="flex flex-col gap-2">
      {services.map((service) => (
        <li key={service.id}>
          <ServiceListRow service={service} currency={currency} />
        </li>
      ))}
    </ul>
  );
}

function ServiceListRow({
  service,
  currency,
}: {
  service: Service;
  currency: string;
}): React.JSX.Element {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const show = useToast((s) => s.show);
  const [optimisticActive, setOptimisticActive] = React.useOptimistic(service.active);

  const onToggle = (next: boolean): void => {
    startTransition(async () => {
      setOptimisticActive(next);
      const res = await setServiceActiveAction({ id: service.id, active: next });
      if (!res.ok) {
        show(res.error ?? "Couldn't update.", ToastVariant.ERROR);
        return;
      }
      router.refresh();
    });
  };
  const active = optimisticActive;

  return (
    <LabeledRow
      title={
        <Link
          href={`/dashboard/settings/services/${service.id}`}
          className="hover:underline"
        >
          {service.name}
        </Link>
      }
      subtitle={
        active
          ? `${service.durationMin} min · ${formatPrice(service.priceCents, currency)}`
          : `${service.durationMin} min · ${formatPrice(service.priceCents, currency)} · inactive`
      }
      leading={
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-tint text-primary">
          <Scissors className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
      }
      trailing={
        <Switch
          checked={active}
          disabled={pending}
          onCheckedChange={onToggle}
          aria-label={`${active ? "Deactivate" : "Activate"} ${service.name}`}
        />
      }
      dim={!active}
    />
  );
}
