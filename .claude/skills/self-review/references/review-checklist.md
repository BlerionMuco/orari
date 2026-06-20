# Review checklist

Layered by concern. Jump to the layers the feature touches. Each item is a place this stack tends to break — the project-specific traps are called out, not generic advice.

Roughly ordered by stakes: tenant/auth and data integrity first (a bug here is a breach or corruption), then correctness, then UX/a11y, then consistency.

---

## 1. Multi-tenancy & authorization — highest stakes

A booking platform's worst bug is one shop seeing or mutating another shop's data. Scrutinize every data access.

- **Every query is tenant-scoped.** No `select`/`update`/`delete` that could return or touch another org's rows. Trace the org/tenant id back to the **session**, not to a value taken from the request body or client — accepting `orgId` from the client and trusting it is the classic IDOR.
- **RLS is a backstop, not the only guard — and the service role bypasses it.** If a server action or route handler uses the Supabase **service_role** client, RLS does nothing; tenant scoping must be explicit in the query. Confirm which client is in use. A service-role query with no `where org_id = …` is wide open even though RLS is "on."
- **New table → new RLS policies.** A table added this feature with no policy is fully exposed to the anon/authenticated path. Check the migration.
- **Server actions and route handlers are public endpoints.** Anyone can POST to them. Each must: (a) authenticate, (b) verify the caller is a member of the org it's mutating, (c) validate input with Zod *before* use. "It's only called from our form" is not a control.
- **Staff vs owner.** Barbers manage their own slots — a staff-scoped mutation must verify the resource belongs to that staff member, not just that the caller is some authenticated user in the org.

## 2. Data integrity — DB-level correctness is non-negotiable

- **Double-booking is prevented by the exclusion constraint, not by app logic.** A "check if the slot is free, then insert" sequence is a TOCTOU race — two concurrent confirms both pass the check. The constraint is the source of truth. So the real question: **does the booking path catch the constraint violation** (`23P01` exclusion / `23505` unique) and turn it into a clean "slot no longer available" instead of a 500? If it doesn't handle that error path, it's a blocker under concurrency.
- **`reserved_range` is maintained by a trigger, not a generated column.** Any new write path that sets booking times must let the trigger compute the range — code that writes `reserved_range` directly, or a migration that converts it to generated, breaks the invariant.
- **Timezone / DST.** Albania observes DST. Times must be `timestamptz`, compared in one consistent zone, and rendered in the **business's** timezone — not the server's, not the browser's local time naïvely. Look hard at slot generation and availability math across a DST boundary and around midnight; off-by-one-hour and missing/duplicated slots live here.
- **Drizzle migration discipline** (if this feature has a migration):
  - Journal entry **and** snapshot file both present.
  - `BEGIN`/`COMMIT` removed in favor of `--> statement-breakpoint` markers.
  - `CREATE OR REPLACE FUNCTION` signature matches the original **exactly** — parameter names, enum types, and `DEFAULT` values. A mismatch creates a second overload instead of replacing the function.
  - Migration is reversible/round-trips, or the irreversibility is intentional and noted.

## 3. Server / client boundary (App Router)

- **No secrets cross to the client.** Service-role key, billing/MoR secrets, anything server-only must never be imported into a `'use client'` module or passed as a prop / serialized into client-rendered output. Grep the changed client components for env access.
- **`cache()` dedup needs a single module-scope reference.** A `cache()`-wrapped loader created per-render or re-wrapped at each call site dedupes nothing — every caller gets its own memo. Confirm the wrapped function (e.g. `loadBusiness`) is defined once at module scope and imported.
- **Component placement.** Server components by default; `'use client'` only where interactivity/hooks require it. A component that fetches in the client what a parent server component could fetch directly is a smell (waterfalls, exposed surface).
- **Server action return + error handling.** Return values must be serializable. Unhandled throws hit the nearest error boundary — is that intended, or should it return a typed error the form can render? RHF/Zod on the client is UX; the action must **re-validate** server-side.

## 4. TypeScript strictness

- **Inference widening defeating exhaustiveness.** A `string[]` (or widened literal) where a discriminated union belongs lets a missing case slip past strict-mode exhaustiveness. State machines (wizard steps, booking status) want a union type and an exhaustive `switch` with a `never` default that fails the build when a case is added. Check the wizard's `Step` handling specifically.
- **No `any`, no reflexive `!`, no unchecked casts at boundaries.** External/untrusted data (request bodies, query results, third-party payloads) is **parsed with Zod**, not cast. A `as` at an I/O boundary is a lie to the compiler.
- **Schema and type agree.** Zod schema and the TS type are derived from one source (`z.infer`), not maintained in parallel where they can drift.

## 5. React correctness

- **Effects.** Correct dependency arrays; no stale closures from missing deps; nothing in an effect that should be derived state or an event handler; no setState-in-render. An effect that syncs state that could've been computed during render is usually a bug waiting to desync.
- **Reducer transitions (wizard).** Cross-field invalidation actually fires: selecting a new service clears the downstream resource **and** slot selection. Walk each action and confirm no stale downstream state survives an upstream change.
- **List keys** are stable and unique — not the array index where items can reorder, insert, or delete.
- **React Query.** Query keys include **every** input that changes the result (tenant, resource, date). A mutation invalidates the exact keys that should refetch — stale UI after a successful booking/cancel is the tell that invalidation missed a key.

## 6. Accessibility & interaction

- **Custom interactive widgets need full keyboard support.** Anything hand-rolled (radio group, select, listbox, the slot picker) needs roving tabindex, arrow-key navigation **with wraparound**, and correct ARIA roles — the `useRadioGroup` lesson. A `div` with `onClick` and no keyboard path is broken for keyboard and screen-reader users.
- **Focus management.** On step transitions focus moves into the new step; modals trap focus and restore it on close; nothing is left focusing a detached node.
- **Library primitives intact.** `react-day-picker`, `cmdk`, Radix primitives keep their built-in keyboard/SR behavior — custom styling shouldn't strip roles or override key handling.
- **Motion.** Framer Motion respects `prefers-reduced-motion`; animations don't block interaction, trap focus, or cause layout shift / CLS.
- **Forms.** Every input has an associated label; error messages are programmatically tied to their field, not just colored red.

## 7. Error, empty & edge states

- **Beyond the happy path.** Loading, empty, and error states exist and render. Mobile-first: does it hold at ~360px?
- **Async failures surface.** Network/query/mutation failures are shown to the user, not swallowed in a `catch {}`.
- **Boundary inputs for *this* domain:** an org with no logo (the `object-contain` + host-allowlist path — `next/image` `onError` does **not** gracefully handle an unconfigured remote host; a pure `isAllowedLogoHost` guard must run first), a fully-booked day, a shop with multiple resources vs one, a guest with no account, a double-submit / double-tap on confirm.
- **Inngest jobs** (if touched): idempotent on retry, failures observable, no assumption a job runs exactly once.

## 8. Consistency with conventions

- Matches `CLAUDE.md`. Respects the three-level hierarchy (Page → Section → Component) with responsibilities at the right level, and **no prop drilling**.
- Design tokens only — colors come from the Calm Neutral token set in `color-system.md`; no hardcoded hex outside it.
- **No dead code.** Every new prop, abstraction, file, or dependency earns its place *now*. Flag speculative generality — a reintroduced `orgSlug`, a premature Zustand store, an unused export, a config flag nothing reads.
