"use client";

import * as React from "react";
import { Button } from "@/components/ui/buttons/button";
import { ErrorScreen } from "@/components/ui/feedback/error-screen";
import { ErrorBezel } from "@/components/ui/feedback/error-bezel";
import { WarningIllustration } from "@/components/ui/feedback/error-illustrations/warning-illustration";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Root error boundary (500). Catches render/data errors below the root layout.
export default function Error({ error, reset }: ErrorProps): React.JSX.Element {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      alert
      code="500"
      title="Something went sideways"
      body="We hit an unexpected error loading this page — it's on our side, not yours. We're looking into it. Try again in a moment."
      illustration={
        <ErrorBezel>
          <WarningIllustration />
        </ErrorBezel>
      }
      actions={
        <>
          <Button onClick={reset} className="w-full sm:w-auto">
            Try again
          </Button>
          {/* TODO(support): no support route yet — points at the business inbox. */}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="mailto:orari.albania@gmail.com?subject=Orari%20%E2%80%94%20Server%20error">
              Contact support
            </a>
          </Button>
        </>
      }
    />
  );
}
