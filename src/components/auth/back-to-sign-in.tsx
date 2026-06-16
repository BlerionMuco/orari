import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackToSignIn(): React.JSX.Element {
  return (
    <div className="mt-[22px] flex justify-center">
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-1.5 rounded-md text-[13.5px] font-medium text-text-muted transition-colors hover:text-text focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
      >
        <ArrowLeft className="h-[15px] w-[15px]" aria-hidden="true" />
        Back to sign in
      </Link>
    </div>
  );
}
