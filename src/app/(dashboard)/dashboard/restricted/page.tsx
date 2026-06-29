import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { ErrorScreen } from "@/components/ui/feedback/error-screen";
import { ErrorBezel } from "@/components/ui/feedback/error-bezel";
import { LockIllustration } from "@/components/ui/feedback/error-illustrations/lock-illustration";

// Surfaced when staff tries to open an owner-only route. Server-rendered so
// even direct URL access lands on a polite block.
export default function RestrictedPage(): React.JSX.Element {
  return (
    <ErrorScreen
      embedded
      code="403"
      title="This door stays shut"
      body="You don't have permission to view this page. If you think that's a mistake, ask an admin to grant you access."
      illustration={
        <ErrorBezel>
          <LockIllustration />
        </ErrorBezel>
      }
      actions={
        <>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          {/* TODO(access): no request-access flow yet — points at the business inbox. */}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="mailto:orari.albania@gmail.com?subject=Orari%20%E2%80%94%20Access%20request">
              Request access
            </a>
          </Button>
        </>
      }
    />
  );
}
