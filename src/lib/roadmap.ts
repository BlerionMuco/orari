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

export const V1_ROADMAP_UPDATED = "2026-06-28";
// Core booking engine shipped (getAvailableSlots, booking-creation transaction,
// timezone/DST) — see docs/v1/booking-engine.md. Public booking wizard wired
// end-to-end (multi-service basket → real availability → confirmed booking).
// Onboarding completed: a 5-step wizard creates a fully bookable business
// (services + shared hours + team + public slug) in one atomic RPC (0010).
// Dashboard surface shipped end-to-end (M0–M7): cross-cutting atoms (toast,
// screen-state, skeleton, status-badge, confirm-dialog, sheet, segmented-
// control, time-select, chip-group, labeled-row, section-card, setting-row,
// list-card, lifted day-strip, date-pill, nav-link, page-header) + Zustand
// stores (use-toast, use-confirm); shell w/ desktop sidebar + mobile tab bar;
// Home, Calendar, Booking detail (complete / no-show / cancel + no-show
// history), Services CRUD, Team + invites (resend / revoke / toggle), Working
// hours editor, Booking rules, Reminders, Business profile (live slug check),
// Account (profile + change password + sign-out), Manual booking + block-time,
// Invite accept (/invite/[token] → accept_invite RPC), Billing placeholder
// reading the new subscription scaffold. Migration 0011 added subscription_
// status enum + trial_ends_at + reminder_enabled + reminder_offsets_min; 0012
// added trial_ends_at default + backfill.

export const V1_ROADMAP: RoadmapGroup[] = [
  {
    title: "Foundation",
    items: [
      { label: "Project scaffold — Next.js, Tailwind, Radix, RHF/Zod, Zustand, React Query, TS", status: "done", note: "React Query structured as a per-domain data layer (lib/<domain>/query + central QUERY_KEYS; useQuery reads / useMutation writes; retry:false) — see docs/v1/react-query.md" },
      { label: "Route groups — (auth), (public), (dashboard)", status: "done" },
      { label: "Supabase clients + proxy session refresh", status: "done", note: "/auth/callback excluded from the proxy matcher so it doesn't double-write cookies during the recovery exchange" },
      { label: "Shared Zod schema pattern (src/lib/schemas)", status: "done" },
      { label: "Schema + migrations — businesses, resources, services, bookings, booking_services, booking_rules, profiles, memberships, invites, working_hours, time_off", status: "done", note: "booking_services junction (0009) for multi-service bookings — RLS + idempotent backfill" },
      { label: "Double-booking exclusion constraint", status: "done" },
      { label: "business_id on every table + RLS policies", status: "done", note: "RLS on all tenant tables via memberships + current_user_business_ids()" },
      { label: "Subscription scaffold — status enum + trial_ends_at + entitlements stub", status: "partial", note: "0011 added subscription_status enum (trial/active/past_due/cancelled) + trial_ends_at; 0012 added default (now + 30d) + backfill; billing screen reads via lib/billing/queries.ts. Entitlements gating not wired yet (Paddle/Lemon Squeezy out of V1)" },
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
      { label: "Multi-tenancy — every query scoped to the business", status: "done", note: "RLS + current_user_business_ids() + businessScope() seam applied across every dashboard domain (booking, services, team, hours, booking-rules, reminders, businesses, time-off, billing); Drizzle bypasses RLS so the scoped WHERE is the tenant boundary" },
      { label: "Invite-accept page (/invite/[token] → accept_invite)", status: "done", note: "M6: server resolves token (5-variant kind: not_found / expired / accepted / revoked / pending); pending → AcceptCard wraps accept_invite RPC; expired/revoked/used/not-found → ScreenState; signed-in members of another business bounce to /dashboard (V1 = one business per user)" },
    ],
  },
  {
    title: "Core engine (build slowly, test hardest)",
    items: [
      { label: "getAvailableSlots() — hours, time-off, buffers, lead time, advance window, rules", status: "done", note: "pure layered subtraction; split shifts + overnight + buffers; multi-service basket (summed duration, first/last buffers, most-restrictive combined rules); unit-tested" },
      { label: "Booking-creation transaction — re-validate + rely on the exclusion constraint", status: "done", note: "confirm-only; multi-service (one block + N booking_services rows in one tx, primary-service invariant); reserved_range EXCLUDE wins the race (23P01); idempotency-key + transactional outbox; verified concurrent + write proven against DB" },
      { label: "Timezone correctness — UTC storage, business-tz math, DST", status: "done", note: "@date-fns/tz; spring-forward gap skipped, fall-back earlier-occurrence, 23/25h days" },
    ],
  },
  {
    title: "Onboarding",
    items: [
      { label: "Onboarding wizard shell with step progress", status: "done", note: "5-step wizard (Business → Services → Hours → Team → Go live) on RHF + zod; segmented progress + desktop checklist rail; atomic all-or-nothing create" },
      { label: "Steps: profile → vertical → service → resource → hours → go-live (slug + URL)", status: "done", note: "all shipped: business basics + vertical, multi-service, shared weekly hours, team (owner + email invites), editable slug with live availability check; one SECURITY DEFINER RPC (create_business_onboarding, 0010) creates business + rules + resources + services + hours" },
    ],
  },
  {
    title: "Public booking surface",
    items: [
      { label: "Business public page (profile header, services list)", status: "done", note: "responsive booking wizard; mobile app-shell (sticky nav, dvh height chain)" },
      { label: "Service selection (multi-select basket)", status: "done", note: "multi-service: pick >1 per booking; summed duration/price; Radix CheckboxCard" },
      { label: "Resource selection (skippable when only one)", status: "done", note: "specific barber or 'Any available' (server-assigned); Radix RadioGroup" },
      { label: "Time picker — real availability + slot states + timezone label", status: "done", note: "real /api/public/availability fetch (react-query); drag/swipe day strip; slots scroll in capped box" },
      { label: "Guest details form (name, phone, email — no account)", status: "done", note: "name + phone + email (optional, validated) + note; threaded to the engine (customer_email persisted)" },
      { label: "Confirmation screen", status: "done", note: "success panel — code, summary, add-to-calendar (ICS); real createBookingAction" },
      { label: "Manage-booking page via tokenized link (view / cancel / reschedule)", status: "todo", note: "BE ready (loadBookingByManageToken, cancelBooking/cancelBookingAction); no route/UI yet" },
      { label: "Error states — 404, business not found, no availability", status: "done", note: "not-found route + empty-business + empty-day (jump-to-next); rate limiting still separate" },
    ],
  },
  {
    title: "Dashboard surface",
    items: [
      { label: "Overview / home", status: "done", note: "M1: greeting + Next booking card + Later today list; role-aware (staff filtered to own resource); skeleton / empty / error via ScreenState" },
      { label: "Day view of bookings (read-only list)", status: "done", note: "M1: Calendar route w/ lifted day-strip + resource filter chips (owner) + booking list cards; listDayBookings via businessScope" },
      { label: "Booking detail with status actions (complete / no-show / cancelled)", status: "done", note: "M1: customer card + meta + status badge + contact (tel/mailto) + notes + actions; mark-complete / mark-no-show / cancel actions w/ confirm dialog + toast" },
      { label: "Services management (CRUD)", status: "done", note: "M2: list w/ active toggle + edit (name/duration/price/buffers/active) + delete (confirm); lib/services/{queries,actions} + query layer + zod schema" },
      { label: "Single-resource management + working-hours editor", status: "done", note: "M3: team (member-card + pending-invite-card + invite-form sheet) wraps add_team_member RPC + resend/revoke/toggle; hours editor (resource picker, 7-day rows, time-select, apply-all) writes via replaceWorkingHours tx; reuses lib/onboarding/hours validators" },
      { label: "Booking-rules settings (lead time, advance window, buffers)", status: "done", note: "M4: lead_time_min + advance_window_days + slot_granularity_min on the service_id IS NULL row; lib/booking-rules/{queries,actions}" },
      { label: "Business profile / public-page basics editor", status: "done", note: "M4: name / slug (live availability check via lib/onboarding/slug) / phone / description / location / currency; copy-field for public URL; updateBusinessProfile" },
      { label: "Account / settings shell", status: "done", note: "M2 settings menu (role-aware: Shop section owner-only + You section everyone) + M4 account form (name + email + change-password via Supabase updateUser) + sign-out card (now red destructive confirm)" },
      { label: "Manual booking + block-time (for walk-ins)", status: "done", note: "M5: segmented mode tabs (booking | block, staff = block only, server-enforced); booking reuses get-available-slots + createBookingAction; block writes time_off row via createBlockTimeAction; SMS-notify row disabled w/ 'coming soon' until SMS provider lands" },
      { label: "Status transitions + basic no-show history", status: "done", note: "M1: BookingStatus state machine (confirmed → completed / no-show / cancelled) via mark-complete / mark-no-show / cancel-booking-scoped; countNoShowsForCustomer surfaces a flag on the detail page when prior no-shows exist" },
      { label: "Reminders settings (enable + offsets)", status: "done", note: "M4: reminder_enabled + reminder_offsets_min[] columns (0011) + form (off / 24h / 1h / both); read by future Inngest dispatcher" },
      { label: "Billing placeholder", status: "done", note: "M7: owner-only /dashboard/settings/billing; trial-status-card (status pill + days left + trial-ends date) + plan-stub (included features) + coming-soon-card; reads getSubscriptionState (0011/0012 scaffold); no write surface — Paddle/Lemon Squeezy out of V1" },
      { label: "Restricted screen for staff-blocked routes", status: "done", note: "M1: server gate (role !== owner → redirect) + /dashboard/restricted with ScreenState lock variant" },
    ],
  },
  {
    title: "Notifications & launch plumbing",
    items: [
      { label: "Inngest jobs — releaseHeldSlot + sendBookingReminder", status: "partial", note: "reminder + outbox drainer wired (drainOutbox re-emits booking/confirmed); reminder cadence now configurable per business via reminder_enabled + reminder_offsets_min (0011); releaseHeldSlot still a stub (holds deferred); dispatcher not yet reading the new offsets" },
      { label: "Confirmation email + scheduled reminder (Resend/Postmark + Inngest)", status: "todo" },
      { label: "Transactional email deliverability set up", status: "todo" },
      { label: "Rate limiting on the public unauthenticated surface", status: "todo" },
      { label: "Basic product analytics on the booking funnel", status: "todo" },
    ],
  },
  {
    title: "Cross-cutting UI",
    items: [
      { label: "Empty states, loading skeletons, error boundaries", status: "done", note: "ScreenState (empty / error / loading / restricted variants) + Skeleton + StatusBadge primitives shipped in M0 and reused across every dashboard list / detail / settings view" },
      { label: "Toast / confirm dialogs", status: "done", note: "Radix Toast (success / info / error, auto-dismiss) + Radix Dialog ConfirmDialog (danger variant, async resolve) mounted once in the dashboard layout; driven by Zustand stores (use-toast, use-confirm); danger confirm now solid-red bg" },
      { label: "Mobile layouts for all public screens", status: "done", note: "public booking wizard mobile-first (sticky nav, dvh chain); dashboard surface built mobile-first to 375px (sidebar md+ only; fixed bottom tab bar w/ safe-area inset on mobile; desktop locks h-dvh + scrolls in main, mobile uses body scroll)" },
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
  "Customer accounts",
  "Public-page editor",
  "Analytics dashboards",
  "Deposits / customer payments",
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
