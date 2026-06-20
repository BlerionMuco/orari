"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { isAllowedLogoHost } from "@/lib/business/logo-host";
import { initials } from "@/lib/business/initials";

export type LogoSize = "sm" | "md" | "lg";

interface SizeSpec {
  box: string;
  text: string;
  img: number;
}

const SIZES: Record<LogoSize, SizeSpec> = {
  sm: { box: "h-9.5 w-9.5 rounded-[11px] text-[14px]", text: "text-[14px]", img: 30 },
  md: { box: "h-11.5 w-11.5 rounded-[13px] text-[17px]", text: "text-[17px]", img: 38 },
  lg: { box: "h-13.5 w-13.5 rounded-[15px] text-[20px]", text: "text-[20px]", img: 44 },
};

export interface BusinessLogoProps {
  logoUrl: string | null;
  name: string;
  size?: LogoSize;
}

// Real logo on a neutral white tile (object-contain, so wordmarks aren't
// cropped), else an initials monogram on a tinted tile. The host guard runs
// before next/image (which throws on an unconfigured host); onError is the
// fallback for an allow-listed-but-broken image.
export function BusinessLogo({
  logoUrl,
  name,
  size = "md",
}: BusinessLogoProps): React.JSX.Element {
  const spec = SIZES[size];
  const [errored, setErrored] = React.useState(false);
  const showImage = Boolean(logoUrl) && isAllowedLogoHost(logoUrl ?? "") && !errored;

  if (showImage && logoUrl) {
    return (
      <span
        className={cn(
          "flex flex-none items-center justify-center overflow-hidden border border-border bg-surface p-1.5",
          spec.box,
        )}
      >
        <Image
          src={logoUrl}
          alt={name}
          width={spec.img}
          height={spec.img}
          className="h-full w-full object-contain"
          onError={() => setErrored(true)}
        />
      </span>
    );
  }

  const monogram = initials(name) || name.trim().charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center bg-primary-tint font-semibold tracking-[-0.01em] text-primary",
        spec.box,
      )}
    >
      {monogram}
    </span>
  );
}
