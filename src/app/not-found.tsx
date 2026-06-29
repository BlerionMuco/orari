import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/buttons/button";
import { ErrorScreen } from "@/components/ui/feedback/error-screen";
import { ErrorBezel } from "@/components/ui/feedback/error-bezel";
import { CompassIllustration } from "@/components/ui/feedback/error-illustrations/compass-illustration";

// Root global 404. The booking segment keeps its own more-specific not-found.
export default function NotFound(): React.JSX.Element {
  return (
    <ErrorScreen
      code="404"
      title="We've lost our bearings"
      body="This page isn't on the map. It may have moved or never existed — let's point you back home."
      illustration={
        <ErrorBezel>
          <CompassIllustration />
        </ErrorBezel>
      }
      actions={
        <>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">Take me home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/dashboard">My appointments</Link>
          </Button>
        </>
      }
    />
  );
}
