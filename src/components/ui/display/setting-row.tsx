"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  className?: string;
}

// Icon + title + subtitle + chevron row used by the Settings menu and any
// sub-page that links into deeper destinations. Renders an <a> when `href` is
// provided, a <button> otherwise.
export function SettingRow({
  icon,
  title,
  subtitle,
  href,
  onClick,
  trailing,
  className,
}: SettingRowProps): React.JSX.Element {
  const inner = (
    <>
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-primary-tint text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[14.5px] font-semibold text-text">{title}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[12px] text-text-muted">{subtitle}</span>
        ) : null}
      </span>
      {trailing ? <span className="flex-none">{trailing}</span> : null}
      <ChevronRight className="h-4 w-4 flex-none text-text-disabled" aria-hidden="true" />
    </>
  );
  const sharedClass = cn(
    "flex min-h-12 w-full items-center gap-3 rounded-[12px] px-3 py-2 transition-colors hover:bg-bg",
    "focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={sharedClass}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={sharedClass}>
      {inner}
    </button>
  );
}
