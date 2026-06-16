import * as React from "react";

export interface FormErrorProps {
  message?: string;
}

// Top-level form error banner (e.g. "Invalid login credentials" from the server).
// Renders nothing when there's no message.
export function FormError({ message }: FormErrorProps): React.JSX.Element | null {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mb-4 rounded-md border border-danger bg-danger-bg px-3 py-2 text-[13px] text-danger-text"
    >
      {message}
    </p>
  );
}
