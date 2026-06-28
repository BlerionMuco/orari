"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPrefix?: boolean;
  variant?: "sidebar" | "tab";
  className?: string;
}

// Single nav item used by both desktop sidebar and mobile bottom tabs. The
// match policy defaults to exact (`/dashboard`) and switches to prefix for
// nested sections (`/dashboard/settings/...`).
export function NavLink({
  href,
  label,
  icon,
  matchPrefix = false,
  variant = "sidebar",
  className,
}: NavLinkProps): React.JSX.Element {
  const pathname = usePathname();
  const active = matchPrefix
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;
  if (variant === "tab") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-[12px] px-2 py-1 transition-colors",
          active ? "text-primary-pressed" : "text-text-muted",
          className,
        )}
      >
        <span className="flex h-5.5 w-5.5 items-center justify-center" aria-hidden="true">
          {icon}
        </span>
        <span className="text-[10.5px] font-semibold">{label}</span>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] font-medium transition-colors",
        active
          ? "bg-primary-tint text-primary-pressed"
          : "text-text-muted hover:bg-fill-subtle hover:text-text",
        className,
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
