"use client";

import * as React from "react";
import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import type {
  PublicBusiness,
  PublicResource,
  PublicService,
} from "@/lib/booking/public-dto";
import { buildSteps, type Step } from "@/lib/booking/steps";
import type { AvailabilitySlot } from "@/lib/booking/types";

// RESOURCE_ANY = the server picks a free resource (createAnyBooking). A concrete
// id = that specific resource.
export const RESOURCE_ANY = "any" as const;
export type ResourceChoice = string | typeof RESOURCE_ANY;

export const WizardStatus = {
  IDLE: "idle",
  CONFIRMING: "confirming",
  BOOKED: "booked",
} as const;
export type WizardStatus = (typeof WizardStatus)[keyof typeof WizardStatus];

export interface GuestDetails {
  name: string;
  phone: string;
  note: string;
}

export interface WizardErrors {
  name?: string;
  phone?: string;
}

export interface BookingResult {
  manageToken: string;
  confirmationCode: string;
  resourceName: string;
}

export interface BookingWizardState {
  // Static context (from the page).
  business: PublicBusiness;
  services: PublicService[];
  resources: PublicResource[];
  steps: Step[];

  // Dynamic selection.
  stepIndex: number;
  serviceIds: string[]; // multi-select (design); engine submit waits on multi-service
  resourceId: ResourceChoice | null;
  dayIso: string | null;
  slot: AvailabilitySlot | null; // the chosen slot (carries its local label)
  guest: GuestDetails;
  errors: WizardErrors;
  status: WizardStatus;
  result: BookingResult | null;
  // Stable per slot-selection key that de-dupes repeated Confirm clicks server
  // side; rotated whenever a (new) slot is picked so edited intent books afresh.
  idempotencyKey: string | null;
  // A submit-time failure message (e.g. "slot just taken"), shown on Review.
  submitError: string | null;

  // Setters (granular; flow logic lives in the orchestrator).
  setStepIndex: (i: number) => void;
  toggleService: (id: string) => void;
  setResource: (id: ResourceChoice) => void;
  setDay: (iso: string) => void;
  setSlot: (slot: AvailabilitySlot | null) => void;
  setGuest: (patch: Partial<GuestDetails>) => void;
  setErrors: (errors: WizardErrors) => void;
  setStatus: (status: WizardStatus) => void;
  setResult: (result: BookingResult) => void;
  setSubmitError: (error: string | null) => void;
  reset: () => void;
}

export interface BookingWizardInit {
  business: PublicBusiness;
  services: PublicService[];
  resources: PublicResource[];
}

type Store = StoreApi<BookingWizardState>;

// Avoids crypto.randomUUID(): it's undefined in insecure contexts (plain-HTTP
// LAN on a phone) and would throw. Math.random/Date.now are always available
// client-side; uniqueness here only needs to be per-attempt, not cryptographic.
function newIdempotencyKey(): string {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function createBookingWizardStore(init: BookingWizardInit): Store {
  const emptyDynamic = {
    stepIndex: 0,
    serviceIds: [] as string[],
    resourceId: null,
    dayIso: null,
    slot: null,
    guest: { name: "", phone: "", note: "" },
    errors: {},
    status: WizardStatus.IDLE,
    result: null,
    idempotencyKey: null,
    submitError: null,
  };

  return createStore<BookingWizardState>((set) => ({
    business: init.business,
    services: init.services,
    resources: init.resources,
    steps: buildSteps(init.resources.length),
    ...emptyDynamic,

    setStepIndex: (i) => set({ stepIndex: i }),
    // Toggling the basket changes total duration, so any chosen slot/key from
    // the old basket is stale — clear both.
    toggleService: (id) =>
      set((s) => ({
        serviceIds: s.serviceIds.includes(id)
          ? s.serviceIds.filter((x) => x !== id)
          : [...s.serviceIds, id],
        slot: null,
        idempotencyKey: null,
        submitError: null,
      })),
    setResource: (id) => set({ resourceId: id }),
    // Changing the day clears the slot/key — a stale instant must never survive.
    setDay: (iso) => set({ dayIso: iso, slot: null, idempotencyKey: null }),
    // Picking a slot rotates the idempotency key (so a resubmit of NEW intent
    // books afresh); clearing the slot drops the key.
    setSlot: (slot) =>
      set({
        slot,
        idempotencyKey: slot ? newIdempotencyKey() : null,
        submitError: null,
      }),
    setGuest: (patch) => set((s) => ({ guest: { ...s.guest, ...patch } })),
    setErrors: (errors) => set({ errors }),
    setStatus: (status) => set({ status }),
    setResult: (result) => set({ result }),
    setSubmitError: (submitError) => set({ submitError }),
    reset: () => set({ ...emptyDynamic }),
  }));
}

const BookingWizardContext = React.createContext<Store | null>(null);

export function BookingWizardProvider({
  business,
  services,
  resources,
  children,
}: BookingWizardInit & { children: React.ReactNode }): React.JSX.Element {
  // Created once per mount (lazy init); discarded on unmount (per-page, not a
  // singleton).
  const [store] = React.useState<Store>(() =>
    createBookingWizardStore({ business, services, resources }),
  );
  return (
    <BookingWizardContext.Provider value={store}>
      {children}
    </BookingWizardContext.Provider>
  );
}

export function useBookingWizard<T>(
  selector: (state: BookingWizardState) => T,
): T {
  const store = React.useContext(BookingWizardContext);
  if (store === null) {
    throw new Error("useBookingWizard must be used within BookingWizardProvider");
  }
  return useStore(store, selector);
}
