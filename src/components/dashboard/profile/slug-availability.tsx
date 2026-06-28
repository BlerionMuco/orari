"use client";

import * as React from "react";
import { SlugStatus } from "@/lib/schemas/onboarding";

export interface SlugAvailabilityProps {
  status: SlugStatus;
}

const MESSAGE: Record<SlugStatus, string> = {
  [SlugStatus.IDLE]: "",
  [SlugStatus.CHECKING]: "Checking…",
  [SlugStatus.AVAILABLE]: "This link is available.",
  [SlugStatus.TAKEN]: "Taken — pick another.",
  [SlugStatus.INVALID]: "Use lowercase letters, numbers, hyphens.",
  [SlugStatus.RESERVED]: "Reserved — pick another.",
};

const TONE: Record<SlugStatus, string> = {
  [SlugStatus.IDLE]: "text-text-muted",
  [SlugStatus.CHECKING]: "text-text-muted",
  [SlugStatus.AVAILABLE]: "text-success-text",
  [SlugStatus.TAKEN]: "text-danger-text",
  [SlugStatus.INVALID]: "text-danger-text",
  [SlugStatus.RESERVED]: "text-danger-text",
};

export function SlugAvailability({
  status,
}: SlugAvailabilityProps): React.JSX.Element | null {
  const msg = MESSAGE[status];
  if (!msg) return null;
  return <p className={`text-[13px] ${TONE[status]}`}>{msg}</p>;
}
