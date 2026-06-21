import type { SelectOption } from "@/components/ui/form/select";
import { Step } from "@/lib/schemas/onboarding";

// Timezones offered at onboarding (engine interprets working hours in this zone).
export const TIMEZONE_OPTIONS: readonly SelectOption[] = [
  { value: "Europe/Tirane", label: "Tirana — Albania (GMT+1)" },
  { value: "Europe/Belgrade", label: "Belgrade (GMT+1)" },
  { value: "Europe/Rome", label: "Rome (GMT+1)" },
  { value: "Europe/Athens", label: "Athens (GMT+2)" },
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "Europe/Berlin", label: "Berlin (GMT+1)" },
];

// 48 half-hour options, 00:00 .. 23:30 (the hours step's start/end dropdowns).
export const TIME_OPTIONS: readonly SelectOption[] = Array.from(
  { length: 48 },
  (_, i) => {
    const value = `${String(Math.floor(i / 2)).padStart(2, "0")}:${
      i % 2 === 0 ? "00" : "30"
    }`;
    return { value, label: value };
  },
);

export interface StepMeta {
  name: string; // short label (progress + checklist)
  railSub: string; // desktop checklist sub-label
}

export const STEP_META: Record<Step, StepMeta> = {
  [Step.BUSINESS]: { name: "Business", railSub: "Name, type & timezone" },
  [Step.SERVICES]: { name: "Services", railSub: "What customers book" },
  [Step.HOURS]: { name: "Hours", railSub: "Weekly schedule" },
  [Step.TEAM]: { name: "Team", railSub: "Bookable resources" },
  [Step.GO_LIVE]: { name: "Go live", railSub: "Public link & launch" },
};

// Public booking URL helpers. Host comes from NEXT_PUBLIC_APP_URL (configurable,
// never hardcoded), falling back to the current origin in the browser.
export function bookingHost(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && env.length > 0) return env;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function bookingUrl(slug: string): string {
  return `${bookingHost()}/book/${slug}`;
}

// Protocol-stripped form for display (e.g. "orari.al/book/beni-barber").
export function bookingDisplay(slug: string): string {
  return bookingUrl(slug).replace(/^https?:\/\//, "");
}
