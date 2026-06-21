"use client";

import * as React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  OnboardingInput,
  Step,
  STEP_ORDER,
  SlugStatus,
} from "@/lib/schemas/onboarding";
import { Vertical } from "@/lib/business/labels";
import { defaultWeeklyHours } from "@/lib/onboarding/hours";
import { isReservedSlug, isValidSlugFormat, slugify } from "@/lib/onboarding/slug";
import {
  checkSlugAvailableAction,
  createBusinessAction,
} from "@/app/onboarding/actions";
import { WizardNav } from "@/components/ui/wizard/wizard-nav";
import { AlertBanner } from "@/components/ui/feedback/alert-banner";
import { OnboardingLayout } from "./onboarding-layout";
import { ChecklistStepper } from "./checklist-stepper";
import { SuccessScreen } from "./success-screen";
import { STEP_META } from "./constants";
import { BusinessStep } from "./steps/business-step";
import { ServicesStep } from "./steps/services-step";
import { HoursStep } from "./steps/hours-step";
import { TeamStep } from "./steps/team-step";
import { GoLiveStep } from "./steps/go-live-step";

// Top-level RHF fields validated when leaving each step. Whole-object refines
// (resource count, email dedup, ≥1 open day) only resolve on the final submit.
const FIELDS_FOR_STEP: Record<Step, (keyof OnboardingInput)[]> = {
  [Step.BUSINESS]: ["name", "vertical", "timezone"],
  [Step.SERVICES]: ["services"],
  [Step.HOURS]: ["hours"],
  [Step.TEAM]: ["ownerIsResource", "team"],
  [Step.GO_LIVE]: ["slug"],
};

// Reverse map: which step owns each field (used to route a failed submit back).
const FIELD_STEP: Partial<Record<keyof OnboardingInput, Step>> = {
  name: Step.BUSINESS,
  vertical: Step.BUSINESS,
  timezone: Step.BUSINESS,
  services: Step.SERVICES,
  hours: Step.HOURS,
  ownerIsResource: Step.TEAM,
  team: Step.TEAM,
  slug: Step.GO_LIVE,
};

// Synchronous classification of a slug — idle/invalid/reserved need no server
// round-trip. `null` means "valid + unreserved → ask the server".
function localSlugStatus(slug: string): SlugStatus | null {
  if (!slug) return SlugStatus.IDLE;
  if (!isValidSlugFormat(slug)) return SlugStatus.INVALID;
  if (isReservedSlug(slug)) return SlugStatus.RESERVED;
  return null;
}

// Debounced live availability for the go-live slug. The instant statuses are
// derived during render; the effect only writes the async result (inside its
// callback, never synchronously), with a sequence guard dropping stale replies.
// Until the current slug's result lands, the derived status is "checking".
function useSlugCheck(slug: string): SlugStatus {
  const local = localSlugStatus(slug);
  const [resolved, setResolved] = React.useState<{
    slug: string;
    status: SlugStatus;
  } | null>(null);
  const seq = React.useRef(0);

  React.useEffect(() => {
    if (local !== null) return; // nothing to ask the server
    const id = ++seq.current;
    const timer = setTimeout(async () => {
      const res = await checkSlugAvailableAction(slug);
      if (id !== seq.current) return; // a newer query superseded this one
      const status = res.available
        ? SlugStatus.AVAILABLE
        : res.reason === "taken"
          ? SlugStatus.TAKEN
          : res.reason === "reserved"
            ? SlugStatus.RESERVED
            : SlugStatus.INVALID;
      setResolved({ slug, status });
    }, 650);
    return () => clearTimeout(timer);
  }, [local, slug]);

  if (local !== null) return local;
  return resolved?.slug === slug ? resolved.status : SlugStatus.CHECKING;
}

export function OnboardingWizard(): React.JSX.Element {
  const methods = useForm<OnboardingInput>({
    resolver: zodResolver(OnboardingInput),
    mode: "onTouched",
    defaultValues: {
      name: "",
      vertical: Vertical.BARBER,
      timezone: "Europe/Tirane",
      ownerIsResource: true,
      team: [],
      services: [{ name: "", durationMin: 30, price: 0 }],
      hours: defaultWeeklyHours(),
      slug: "",
    },
  });
  const {
    handleSubmit,
    trigger,
    getValues,
    setValue,
    control,
    reset,
    formState: { isSubmitting },
  } = methods;

  const [stepIndex, setStepIndex] = React.useState(0);
  const [formError, setFormError] = React.useState("");
  const [done, setDone] = React.useState<{ slug: string; name: string } | null>(
    null,
  );

  const step = STEP_ORDER[stepIndex];
  const isLast = step === Step.GO_LIVE;

  const slug = useWatch({ control, name: "slug" }) ?? "";
  const slugStatus = useSlugCheck(isLast ? slug : "");

  async function goNext(): Promise<void> {
    setFormError("");
    const ok = await trigger(FIELDS_FOR_STEP[step]);
    if (!ok) return;
    const nextIndex = stepIndex + 1;
    if (STEP_ORDER[nextIndex] === Step.GO_LIVE && !getValues("slug")) {
      setValue("slug", slugify(getValues("name")));
    }
    setStepIndex(nextIndex);
  }

  function goBack(): void {
    setFormError("");
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function goTo(index: number): void {
    if (index < stepIndex) {
      setFormError("");
      setStepIndex(index);
    }
  }

  const onSubmit = handleSubmit(
    async (values) => {
      setFormError("");
      const result = await createBusinessAction(values);
      if (!result.ok) {
        setFormError(result.error);
        if (result.code === "slug-taken") {
          setStepIndex(STEP_ORDER.indexOf(Step.GO_LIVE));
        } else if (result.field === "team") {
          setStepIndex(STEP_ORDER.indexOf(Step.TEAM));
        }
        return;
      }
      setDone({ slug: result.slug, name: values.name });
    },
    // A whole-object refine (≥1 open day, ≥1 resource, duplicate email) can fail
    // even when every visited step passed its own check — route back to it.
    (errs) => {
      const firstKey = (Object.keys(errs) as (keyof OnboardingInput)[]).find(
        (k) => FIELD_STEP[k] !== undefined,
      );
      const target = firstKey ? FIELD_STEP[firstKey] : undefined;
      if (target) setStepIndex(STEP_ORDER.indexOf(target));
      setFormError("Please review the highlighted fields.");
    },
  );

  if (done) {
    return (
      <SuccessScreen
        businessName={done.name}
        slug={done.slug}
        onReset={() => {
          reset();
          setStepIndex(0);
          setDone(null);
        }}
      />
    );
  }

  const primaryLabel = isLast
    ? isSubmitting
      ? "Going live…"
      : "Go live"
    : "Continue";
  const primaryDisabled =
    isSubmitting || (isLast && slugStatus !== SlugStatus.AVAILABLE);

  return (
    <FormProvider {...methods}>
      <OnboardingLayout
        current={stepIndex + 1}
        total={STEP_ORDER.length}
        stepName={STEP_META[step].name}
        rail={
          <ChecklistStepper
            steps={STEP_ORDER}
            currentIndex={stepIndex}
            onGo={goTo}
          />
        }
        nav={
          <WizardNav
            showBack={stepIndex > 0 && !isSubmitting}
            onBack={goBack}
            onPrimary={isLast ? onSubmit : goNext}
            primaryLabel={primaryLabel}
            primaryDisabled={primaryDisabled}
            primaryBusy={isSubmitting}
            primaryArrow={!isLast}
          />
        }
      >
        {formError ? (
          <div className="mb-4">
            <AlertBanner>{formError}</AlertBanner>
          </div>
        ) : null}

        {step === Step.BUSINESS ? <BusinessStep /> : null}
        {step === Step.SERVICES ? <ServicesStep /> : null}
        {step === Step.HOURS ? <HoursStep /> : null}
        {step === Step.TEAM ? <TeamStep /> : null}
        {step === Step.GO_LIVE ? <GoLiveStep slugStatus={slugStatus} /> : null}
      </OnboardingLayout>
    </FormProvider>
  );
}
