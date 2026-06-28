"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ListCardProps {
  href?: string;
  onClick?: () => void;
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  dim?: boolean;
  className?: string;
}

// Booking / service / team-member row card. Renders as a link when `href` is
// passed (booking list → detail) and a button otherwise (services row).
// Always reads as a single tap target on mobile.
export function ListCard({
  href,
  onClick,
  leading,
  title,
  subtitle,
  trailing,
  dim,
  className,
}: ListCardProps): React.JSX.Element {
  const sharedClass = cn(
    "flex w-full items-center gap-3 rounded-[14px] border border-border bg-surface p-3.5 text-left transition-colors",
    "hover:border-border-strong",
    "focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus",
    dim && "bg-bg",
    className,
  );
  const inner = (
    <>
      {leading ? <span className="flex-none">{leading}</span> : null}
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[14.5px] font-semibold", dim ? "text-text-muted" : "text-text")}>
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block text-[12.5px] text-text-muted">{subtitle}</span>
        ) : null}
      </span>
      {trailing ? <span className="flex-none">{trailing}</span> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={sharedClass}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClass}>
        {inner}
      </button>
    );
  }
  return <div className={sharedClass}>{inner}</div>;
}
