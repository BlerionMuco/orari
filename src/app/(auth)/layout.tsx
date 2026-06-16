import * as React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-bg px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}
