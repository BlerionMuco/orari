import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { ScreenState } from "@/components/ui/feedback/screen-state";

// Surfaced when staff tries to open an owner-only route. Server-rendered so
// even direct URL access lands on a polite block.
export default function RestrictedPage(): React.JSX.Element {
  return (
    <div className="rounded-[18px] border border-border bg-surface">
      <ScreenState
        kind="restricted"
        title="Only the owner can open this"
        body="This area is managed by the shop owner. You can still see your own schedule and account."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to home</Link>
          </Button>
        }
      />
    </div>
  );
}
