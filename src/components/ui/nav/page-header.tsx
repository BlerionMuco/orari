"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  backHref?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  className?: string;
}

// Back chevron + title + optional trailing slot. Renders an <a> when
// `backHref` is passed, a <button> using router.back() when only `onBack` is
// omitted, or no chevron at all when neither is set.
export function PageHeader({
  title,
  backHref,
  onBack,
  trailing,
  className,
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className={cn("mb-5 flex items-center gap-3", className)}>
      {backHref || onBack ? (
        <BackControl backHref={backHref} onBack={onBack} />
      ) : null}
      <h1 className="flex-1 truncate text-[20px] font-semibold tracking-[-0.02em] text-text">
        {title}
      </h1>
      {trailing ? <div className="flex-none">{trailing}</div> : null}
    </div>
  );
}

function BackControl({
  backHref,
  onBack,
}: {
  backHref?: string;
  onBack?: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const className = cn(
    "flex h-10 w-10 flex-none items-center justify-center rounded-full text-text-muted transition-colors hover:bg-fill-subtle",
    "focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus",
  );
  if (backHref) {
    return (
      <Link href={backHref} aria-label="Back" className={className}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={onBack ?? (() => router.back())}
      className={className}
    >
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
