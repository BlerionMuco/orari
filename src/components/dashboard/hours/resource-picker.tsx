"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChipGroup } from "@/components/ui/form/chip-group";

export interface ResourcePickerProps {
  resources: { id: string; name: string }[];
  selectedResourceId: string;
}

// Owner-only: chip filter that swaps the editor between resources via the
// `?resource=` query param. The page re-renders against the new id (SSR);
// the editor's draft state lives only in client-side form state, so a swap
// is also a deliberate "discard drafts" — matching the prototype's
// per-resource locked schedule.
export function ResourcePicker({
  resources,
  selectedResourceId,
}: ResourcePickerProps): React.JSX.Element | null {
  const router = useRouter();
  const params = useSearchParams();
  if (resources.length <= 1) return null;
  return (
    <ChipGroup
      ariaLabel="Resource"
      value={selectedResourceId}
      onValueChange={(id) => {
        const qs = new URLSearchParams(params.toString());
        qs.set("resource", id);
        router.push(`/dashboard/settings/hours?${qs.toString()}`);
      }}
      options={resources.map((r) => ({ value: r.id, label: r.name }))}
    />
  );
}
