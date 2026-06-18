// V1 roadmap data — mirrors docs/v1/v1.md. Keep the two in sync.

export type RoadmapStatus = "done" | "partial" | "todo";

export interface RoadmapItem {
  label: string;
  status: RoadmapStatus;
  note?: string;
}

export interface RoadmapGroup {
  title: string;
  items: RoadmapItem[];
}

export interface RoadmapStats {
  done: number;
  partial: number;
  todo: number;
  total: number;
  percent: number;
}

export const V1_ROADMAP_UPDATED = "2026-06-18";
// Core booking engine shipped (getAvailableSlots, booking-creation transaction,
// timezone/DST) — see docs/v1/booking-engine.md. Multi-resource extension
// shipped (feature 4, milestone 1): union availability + server-side "any
// available" assignment + cancel mutation. Public booking UI still pending
// (milestones 2–4); Public-booking-surface items stay todo until then.

export const V1_ROADMAP: RoadmapGroup[] = [
  {
    title: "Foundation",
    items: [
      { label: "Project scaffold — Next.js, Tailwind, Radix, RHF/Zod, Zustand, React Query, TS", status: "done" },
      { label: "Route groups — (auth), (public), (dashboard)", status: "done" },
      { label: "Supabase clients + proxy session refresh", status: "done", note: "/auth/callback excluded from the proxy matcher so it doesn't double-write cookies during the recovery exchange" },
      { label: "Shared Zod schema pattern (src/lib/schemas)", status: "done" },
      { label: "Schema + migrations — businesses, resources, services, bookings, profiles, memberships, invites, working_hours, time_off", status: "done" },
      { label: "Double-booking exclusion constraint", status: "done" },
      { label: "business_id on every table + RLS policies", status: "done", note: "RLS on all tenant tables via memberships + current_user_business_ids()" },
      { label: "Subscription scaffold — status enum + trial_ends_at + entitlements stub", status: "todo" },
    ],
  },
  {
    title: "Auth + multi-tenancy",
    items: [
      { label: "Sign-up screen (name / email / password + terms)", status: "done", note: "wired to Supabase" },
      { label: "Email-verification screen — 6-digit OTP", status: "done", note: "wired (verifyOtp)" },
      { label: "Login screen (email / password)", status: "done", note: "wired; Google/Apple SSO removed — email/password only in V1" },
      { label: "Password-reset request + reset-confirm screens", status: "done", note: "wired (token_hash recovery); reset page gates on a confirmed session + one transparent retry to fix the first-save hydration race" },
      { label: "Reusable UI primitives — button, input, field, checkbox, OTP, icons, logo", status: "done" },
      { label: "Wire screens to Supabase auth", status: "done" },
      { label: "profiles mirror + handle_new_user trigger", status: "done" },
      { label: "memberships (user ↔ business, role) + current_user_business_ids()", status: "done" },
      { label: "SECURITY DEFINER RPCs — create_business / add_team_member / accept_invite", status: "done" },
      { label: "Auth callback route (/auth/callback) — PKCE + token_hash", status: "done", note: "OAuth providers deferred" },
      { label: "Route guards — proxy presence check + dashboard membership gate", status: "done" },
      { label: "Multi-tenancy — every query scoped to the business", status: "partial", note: "RLS + current_user_business_ids() + businessScope() seam in place; applied as query surfaces land" },
      { label: "Invite-accept page (/invite/[token] → accept_invite)", status: "todo", note: "RPC ready; UI not built" },
    ],
  },
  {
    title: "Core engine (build slowly, test hardest)",
    items: [
      { label: "getAvailableSlots() — hours, time-off, buffers, lead time, advance window, rules", status: "done", note: "pure layered subtraction; split shifts + overnight + buffers; 32 unit tests" },
      { label: "Booking-creation transaction — re-validate + rely on the exclusion constraint", status: "done", note: "confirm-only; reserved_range EXCLUDE wins the race (23P01); idempotency-key + transactional outbox; verified concurrent" },
      { label: "Timezone correctness — UTC storage, business-tz math, DST", status: "done", note: "@date-fns/tz; spring-forward gap skipped, fall-back earlier-occurrence, 23/25h days" },
    ],
  },
  {
    title: "Onboarding",
    items: [
      { label: "Onboarding wizard shell with step progress", status: "partial", note: "2-step wizard built; creates business via create_business RPC, which also seeds the business-default booking_rules row (0007)" },
      { label: "Steps: profile → vertical → service → resource → hours → go-live (slug + URL)", status: "partial", note: "basics + team/owner-is-resource done; service, hours, go-live URL remain" },
    ],
  },
  {
    title: "Public booking surface",
    items: [
      { label: "Business public page (profile header, services list)", status: "partial", note: "route stub only" },
      { label: "Service selection", status: "todo" },
      { label: "Resource selection (skippable when only one)", status: "todo" },
      { label: "Time picker — real availability + slot states + timezone label", status: "todo" },
      { label: "Guest details form (name, phone, email — no account)", status: "todo" },
      { label: "Confirmation screen", status: "todo" },
      { label: "Manage-booking page via tokenized link (view / cancel / reschedule)", status: "todo" },
      { label: "Error states — 404, business not found, no availability", status: "todo" },
    ],
  },
  {
    title: "Dashboard surface",
    items: [
      { label: "Overview / home", status: "partial", note: "route stub only" },
      { label: "Day view of bookings (read-only list)", status: "todo" },
      { label: "Booking detail with status actions (complete / no-show / cancelled)", status: "todo" },
      { label: "Services management (CRUD)", status: "todo" },
      { label: "Single-resource management + working-hours editor", status: "todo" },
      { label: "Booking-rules settings (lead time, advance window, buffers)", status: "todo" },
      { label: "Business profile / public-page basics editor", status: "todo" },
      { label: "Account / settings shell", status: "todo" },
      { label: "Manual booking + block-time (for walk-ins)", status: "todo" },
      { label: "Status transitions + basic no-show history", status: "todo" },
    ],
  },
  {
    title: "Notifications & launch plumbing",
    items: [
      { label: "Inngest jobs — releaseHeldSlot + sendBookingReminder", status: "partial", note: "reminder + outbox drainer wired (drainOutbox re-emits booking/confirmed); releaseHeldSlot still a stub (holds deferred)" },
      { label: "Confirmation email + scheduled reminder (Resend/Postmark + Inngest)", status: "todo" },
      { label: "Transactional email deliverability set up", status: "todo" },
      { label: "Rate limiting on the public unauthenticated surface", status: "todo" },
      { label: "Basic product analytics on the booking funnel", status: "todo" },
    ],
  },
  {
    title: "Cross-cutting UI",
    items: [
      { label: "Empty states, loading skeletons, error boundaries", status: "todo" },
      { label: "Toast / confirm dialogs", status: "todo" },
      { label: "Mobile layouts for all public screens", status: "todo" },
      { label: "Accessibility pass (focus, labels, keyboard) on Radix components", status: "todo" },
      { label: "Motion set — step transitions, slot select, success check", status: "todo" },
    ],
  },
  {
    title: "Landing page (late, pre-go-live)",
    items: [
      { label: "Credible one-pager — no-show value prop + sign-up path", status: "todo" },
    ],
  },
];

export const V1_OUT_OF_SCOPE: string[] = [
  "Drag calendar",
  // NOTE: multi-resource/staff per business is now IN V1 (feature 4) — the
  // engine unions resources and assigns "any available". Per-resource service
  // menus remain out (any active resource does any active service).
  "Customer accounts",
  "Public-page editor",
  "Analytics dashboards",
  "Deposits / customer payments",
  "Teams & roles",
  "Real billing flows",
  "The marketplace",
];

export function getRoadmapStats(groups: RoadmapGroup[]): RoadmapStats {
  const items = groups.flatMap((group) => group.items);
  const done = items.filter((item) => item.status === "done").length;
  const partial = items.filter((item) => item.status === "partial").length;
  const todo = items.filter((item) => item.status === "todo").length;
  const total = items.length;
  const percent = total ? Math.round(((done + partial * 0.5) / total) * 100) : 0;
  return { done, partial, todo, total, percent };
}
