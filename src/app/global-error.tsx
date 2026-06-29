"use client";

import * as React from "react";
import "./globals.css";
import { Button } from "@/components/ui/buttons/button";
import { ErrorScreen } from "@/components/ui/feedback/error-screen";
import { ErrorBezel } from "@/components/ui/feedback/error-bezel";
import { WarningIllustration } from "@/components/ui/feedback/error-illustrations/warning-illustration";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Last-resort boundary for crashes in the root layout itself. It replaces the
// layout, so it must render its own <html>/<body> and re-import global styles.
export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps): React.JSX.Element {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
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
            <Button onClick={reset} className="w-full sm:w-auto">
              Try again
            </Button>
          }
        />
      </body>
    </html>
  );
}
