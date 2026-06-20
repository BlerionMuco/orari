// The booking-wizard step sequence. The "resource" step appears only when the
// business has more than one active resource (a lone resource auto-resolves, so
// no picker). Typed `Step[]` via a push accumulator so the wizard's `switch`
// stays exhaustiveness-checkable under strict mode (a spread-conditional literal
// would silently widen to `string[]`).
export const Step = {
  SERVICE: "service",
  RESOURCE: "resource",
  TIME: "time",
  DETAILS: "details",
  CONFIRMATION: "confirmation",
} as const;
export type Step = (typeof Step)[keyof typeof Step];

export function buildSteps(resourceCount: number): Step[] {
  const steps: Step[] = [Step.SERVICE];
  if (resourceCount > 1) steps.push(Step.RESOURCE);
  steps.push(Step.TIME, Step.DETAILS, Step.CONFIRMATION);
  return steps;
}
