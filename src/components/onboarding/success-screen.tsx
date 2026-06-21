import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, Link2 } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { CopyButton } from "@/components/ui/buttons/copy-button";
import { bookingDisplay, bookingUrl } from "./constants";

export interface SuccessScreenProps {
  businessName: string;
  slug: string;
  onReset: () => void;
}

// Terminal "You're live" screen after a successful create.
export function SuccessScreen({
  businessName,
  slug,
  onReset,
}: SuccessScreenProps): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-135 text-center">
        <div className="mx-auto flex h-22 w-22 items-center justify-center rounded-full bg-success-bg">
          <Check className="h-10 w-10 text-success" strokeWidth={2.5} aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-text lg:text-[28px]">
          You&apos;re live
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] leading-[1.5] text-text-muted">
          {businessName} is ready to take bookings. Share your link or head to the
          dashboard.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-[14px] border border-border bg-surface p-3.5 text-left shadow-card">
          <Link2 className="h-4.5 w-4.5 flex-none text-text-muted" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-disabled">
              Public booking link
            </p>
            <p className="truncate text-[14px] font-medium text-primary">
              {bookingDisplay(slug)}
            </p>
          </div>
          <CopyButton value={bookingUrl(slug)} className="flex-none" />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="sm:px-7">
            <Link href="/dashboard">
              Go to dashboard
              <ArrowRight className="h-4.5 w-4.5" strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/book/${slug}`}>
              <Eye className="h-4.5 w-4.5" aria-hidden="true" />
              Preview booking page
            </Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-5 text-[13px] font-semibold text-text-muted transition-colors hover:text-text focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
        >
          Set up another business
        </button>
      </div>
    </div>
  );
}
