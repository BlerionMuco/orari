import * as React from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

// Rendered when a slug matches no business.
export function BookingNotFound(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-115 rounded-[20px] border border-border bg-surface p-10 text-center shadow-card">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[15px] bg-primary-tint">
        <Search className="h-7 w-7 text-primary" strokeWidth={1.8} />
      </div>
      <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
        Error 404
      </div>
      <h2 className="text-[21px] font-semibold tracking-[-0.01em] text-text">
        We couldn&apos;t find this business
      </h2>
      <p className="mx-auto mt-2.5 max-w-75 text-[14px] leading-[1.55] text-text-muted">
        The link may be broken, or the business may have moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary"
      >
        Go to orari home
        <ArrowRight className="h-4 w-4" strokeWidth={2.1} />
      </Link>
    </div>
  );
}
