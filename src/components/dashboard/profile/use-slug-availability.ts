"use client";

import * as React from "react";
import { SlugStatus } from "@/lib/schemas/onboarding";
import { isReservedSlug, isValidSlugFormat } from "@/lib/onboarding/slug";
import { checkSlugAvailableAction } from "@/app/onboarding/actions";

// Synchronous classification — idle/invalid/reserved skip the round-trip.
function localSlugStatus(slug: string): SlugStatus | null {
  if (!slug) return SlugStatus.IDLE;
  if (!isValidSlugFormat(slug)) return SlugStatus.INVALID;
  if (isReservedSlug(slug)) return SlugStatus.RESERVED;
  return null;
}

// Mirrors the onboarding wizard's useSlugCheck but takes a `currentSlug` so the
// business's existing slug always resolves as AVAILABLE (it's "available" for
// THIS business — the uniqueness check ignores its own row).
export function useSlugAvailability(
  slug: string,
  currentSlug: string,
): SlugStatus {
  const local = localSlugStatus(slug);
  const [resolved, setResolved] = React.useState<{
    slug: string;
    status: SlugStatus;
  } | null>(null);
  const seq = React.useRef(0);

  React.useEffect(() => {
    if (local !== null) return;
    if (slug === currentSlug) return; // unchanged — no need to ask
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      const res = await checkSlugAvailableAction(slug);
      if (id !== seq.current) return;
      const status: SlugStatus = res.available
        ? SlugStatus.AVAILABLE
        : res.reason === "taken"
          ? SlugStatus.TAKEN
          : res.reason === "reserved"
            ? SlugStatus.RESERVED
            : SlugStatus.INVALID;
      setResolved({ slug, status });
    }, 650);
    return () => clearTimeout(timer);
  }, [local, slug, currentSlug]);

  if (slug === currentSlug) return SlugStatus.AVAILABLE;
  if (local !== null) return local;
  return resolved?.slug === slug ? resolved.status : SlugStatus.CHECKING;
}
