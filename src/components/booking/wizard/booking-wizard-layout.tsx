import * as React from "react";

export interface BookingWizardLayoutProps {
  businessCard: React.ReactNode;
  railSummary: React.ReactNode; // desktop-only
  progress: React.ReactNode;
  nav: React.ReactNode;
  children: React.ReactNode; // active step (rendered once)
}

// Single responsive tree (no duplicated step DOM). Mobile: business card →
// progress → step → sticky bottom nav. Desktop (lg): a sticky left rail
// (business card + live summary) beside a card panel (progress → step →
// bottom-right nav).
export function BookingWizardLayout({
  businessCard,
  railSummary,
  progress,
  nav,
  children,
}: BookingWizardLayoutProps): React.JSX.Element {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col lg:block lg:max-w-270">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:grid lg:grid-cols-[356px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="mb-4 flex flex-col gap-4 lg:mb-0 lg:sticky lg:top-8">
          {businessCard}
          <div className="hidden lg:block">{railSummary}</div>
        </aside>
        <main className="flex h-auto min-h-0 min-w-0 flex-1 flex-col lg:rounded-[20px] lg:border lg:border-border lg:bg-surface lg:p-8 lg:shadow-card">
          <div className="lg:flex-none">{progress}</div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 lg:overflow-visible lg:py-6">
            {children}
          </div>
          <div className="-mx-4 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:-mx-8 lg:px-8 lg:pb-0 lg:pt-4">
            {nav}
          </div>
        </main>
      </div>
    </div>
  );
}
