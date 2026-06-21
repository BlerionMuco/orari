import * as React from "react";
import { WizardProgress } from "@/components/ui/wizard/wizard-progress";

export interface OnboardingLayoutProps {
  current: number; // 1-based
  total: number;
  stepName: string;
  rail: React.ReactNode; // desktop checklist
  nav: React.ReactNode;
  children: React.ReactNode; // active step
}

function LogoTile(): React.JSX.Element {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[15px] font-semibold text-surface">
        o
      </span>
      <span className="text-[15px] font-semibold text-text">orari</span>
    </span>
  );
}

// Onboarding shell. Mobile: brand bar → progress → scrolling step → sticky bottom
// nav. Desktop (lg): brand bar, then a sticky checklist rail beside a card panel
// (progress → step → bottom nav). The step DOM renders once for both.
export function OnboardingLayout({
  current,
  total,
  stepName,
  rail,
  nav,
  children,
}: OnboardingLayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <header className="flex items-center border-b border-border bg-surface px-4 py-3 lg:px-8">
        <LogoTile />
        <span className="ml-auto text-[13px] text-text-muted">
          Business setup
        </span>
      </header>

      <div className="mx-auto flex w-full max-w-270 flex-1 flex-col lg:flex-row lg:items-start lg:gap-6 lg:px-8 lg:py-8">
        <aside className="hidden lg:sticky lg:top-8 lg:block lg:w-75 lg:flex-none">
          {rail}
        </aside>

        <main className="flex min-h-0 flex-1 flex-col lg:rounded-[20px] lg:border lg:border-border lg:bg-surface lg:shadow-card">
          <div className="px-4 pt-4 lg:px-8 lg:pt-7">
            <WizardProgress current={current} total={total} stepName={stepName} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6">
            <div className="mx-auto w-full max-w-xl">{children}</div>
          </div>

          <div className="sticky bottom-0 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:px-8 lg:py-4">
            <div className="mx-auto w-full max-w-xl">{nav}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
