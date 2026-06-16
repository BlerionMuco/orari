# Auth & Access Layer — Build Log

What was built when we wired authentication and the multi-tenant access layer on top of
Supabase. This is the foundation every other V1 feature sits on. Companion to [v1.md](./v1.md).

**Decisions locked going in:** email/password only (no Google/Apple SSO in V1) · accountless
customers (later) · build the full access layer now (not a subset) · rename `orgs`→`businesses`
and `staff`→`resources` to match the design.

---

## 1. Data model (schema + migrations)

`src/db/schema.ts` rewritten; migrations regenerated from scratch (no real data existed).

**Renames:** `orgs` → `businesses`, `staff` → `resources` (+ a `type` enum `staff | asset`).
`services` / `bookings` FKs updated to `business_id` / `resource_id`.

**New tables:**
- `profiles` — 1:1 mirror of `auth.users` (FK + populating trigger live in raw SQL).
- `memberships` — M:N `user ↔ business` with a `role` (`owner | staff`), `UNIQUE(user_id, business_id)`. **The security boundary.**
- `invites` — pending staff invites (`email`, `token`, `status`, `expires_at`, optional `resource_id`).
- `working_hours`, `time_off` — belong to a resource; consumed later by the availability engine.

**New enums:** `member_role`, `resource_type`, `invite_status`.

**Migration files** (`src/db/migrations/`):
| File | Contents |
|---|---|
| `0000_*` | All tables + enums (Drizzle-generated) |
| `0001_extensions_profiles` | `btree_gist` + `pgcrypto`; `profiles → auth.users` FK; `handle_new_user` trigger; `current_user_business_ids()` helper |
| `0002_no_double_booking` | `EXCLUDE` constraint on `resource_id` + `tstzrange` (held/confirmed only, `[)` bounds) |
| `0003_rls_policies` | RLS enabled on all 9 tables + 20 policies |
| `0004_rpcs` | `create_business` / `add_team_member` / `accept_invite` |

Applied with `pnpm db:migrate` against Supabase; verified live (9 tables, RLS on all, 20
policies, 5 functions, the EXCLUDE constraint, the trigger).

---

## 2. Row Level Security

- Tenant isolation resolves through `memberships` via the `current_user_business_ids()`
  `SECURITY DEFINER` helper (so policies don't recurse on `memberships`).
- **owner** = full CRUD in their business; **staff** = only the resource where
  `resources.user_id = auth.uid()` (+ its working hours / time off / bookings).
- **No INSERT policy on `businesses` / `memberships`** — the first rows for a brand-new user
  go *only* through the `SECURITY DEFINER` RPCs. This is the RLS "chicken-and-egg" fix: a user
  with zero memberships has no RLS path to create their first business otherwise.
- **On the server, RLS is not the boundary.** The Drizzle client connects with a privileged
  role and bypasses RLS, so server queries must self-scope. `src/lib/db/scoped.ts`
  (`businessScope()`) is the seam for that; RLS is defense-in-depth for the browser/anon path.

## 3. Hardening on every `SECURITY DEFINER` function

`set search_path = ''` + fully-qualified names (incl. `extensions.gen_random_bytes`);
authorization done *inside* each function (RLS doesn't apply to definer internals);
`accept_invite` flips the invite status in the same transaction as the membership insert, with
`UNIQUE(user_id, business_id)` as the final backstop.

---

## 4. Auth flows (the 5 screens, wired)

All wired to `createSupabaseBrowser()`; each form got a top-level `FormError` banner
(`src/components/ui/feedback/form-error.tsx`). SSO buttons removed from sign-in/sign-up.

| Screen | Call |
|---|---|
| Sign in | `signInWithPassword` → `/dashboard` |
| Sign up | `signUp({ options.data.name })` → `/verify` (no `emailRedirectTo` — OTP flow) |
| Verify | `verifyOtp({ type: "signup" })` + `resend` |
| Forgot password | `resetPasswordForEmail` |
| Reset password | `updateUser({ password })` |

`/auth/callback` (`src/app/auth/callback/route.ts`) establishes a session from an email link —
PKCE `exchangeCodeForSession` **and** a `token_hash` + `verifyOtp` fallback (the path recovery
ended up using). Open-redirect guarded (`next` must be a same-origin relative path).

---

## 5. Session, route guards, onboarding, sign-out

- **`src/proxy.ts`** — refreshes the session and does a presence-only guard (unauthenticated on
  a protected path → `/sign-in`; signed-in on an auth page → `/dashboard`). No DB query here.
  `/auth/callback` is excluded from the matcher (gotcha #9) so the proxy doesn't double-write
  session cookies while the callback route is establishing the recovery session.
- **`src/app/(dashboard)/layout.tsx`** — the authoritative gate: no user → `/sign-in`; user with
  no business → `/onboarding`.
- **`src/lib/auth/session.ts`** — `getCurrentUser()` (with a defensive `ensureProfile` upsert),
  `getCurrentBusiness()`.
- **Onboarding** (`src/app/onboarding/`) — server guard (symmetric with the dashboard gate, so no
  redirect loop and no second-business mint) + a 2-step wizard (business basics → team /
  owner-is-resource) calling `create_business` then `add_team_member` per teammate.
- **Sign-out** — server action in `src/lib/auth/actions.ts`, wired into the dashboard.

---

## 6. Environment / config changes

- **Key rename:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (Supabase's newer name; matches `.env.local`). Updated across env, both clients, proxy, `.env.example`.
- **Env split:** `src/lib/env-public.ts` (client-safe, 2 `NEXT_PUBLIC_` vars) vs `src/lib/env.ts`
  (now `server-only`, holds `DATABASE_URL`). Fixes a client-bundle crash — see gotcha #3.
- `drizzle.config.ts` now loads `.env.local`.
- `src/lib/schemas/booking.ts` — `orgId`/`staffId` → `businessId`/`resourceId`.

---

## 7. Gotchas hit & fixed (during live testing)

1. **`DATABASE_URL` port** — migrations need a **session** connection (`:5432`, direct or
   session pooler), not the transaction pooler (`:6543`, which breaks DDL/extensions/triggers).
2. **Password URL-encoding** — special chars (`!@#`) in the DB password must be percent-encoded
   in the connection string; placeholder `[ ]` brackets removed.
3. **Env crash on the client** (`Invalid environment variables: {}`) — `env.ts` validated
   `DATABASE_URL`, but wiring pulled it into the **client** bundle via `createSupabaseBrowser`.
   The browser has no `DATABASE_URL` → threw at module load. Fixed by the env split (#6).
4. **"Create account" did nothing** — the sign-up schema required `confirmPassword`, but the
   form never rendered that field, so RHF validation silently failed on a hidden field. Removed
   `confirmPassword` from sign-up (the minimal mobile form was the intended design).
5. **Template editing locked** — newer Supabase requires custom SMTP before you can edit email
   templates. Set up **Resend** SMTP.
6. **OTP length 8 vs 6** — Supabase project default was 8; the UI is built for 6. Set Email OTP
   length to 6 in Supabase to match.
7. **Confirm-signup email was a magic link, not a code** — switched the template to
   `{{ .Token }}` so the 6-digit OTP screen works.
8. **Password reset PKCE verifier "not found"** — PKCE ties the reset to the browser that
   requested it; opening the email link elsewhere loses the verifier. Switched the **Reset
   password** template to the `token_hash` flow (`/auth/callback?token_hash=…&type=recovery`),
   which is self-contained, works cross-device, and (pointing at `localhost`) can't be consumed
   by Gmail's link scanner.
9. **Reset "link may have expired" on the first save, then worked on retry** — the callback
   establishes the recovery session **server-side** (`verifyOtp` for the token_hash template;
   `exchangeCodeForSession` for PKCE) and writes the cookies on its redirect to `/reset-password`.
   That page is a **client** component, so its browser client hydrates the session from those
   cookies *asynchronously*. A fast tap on Save fired `updateUser` before hydration finished →
   `AuthSessionMissingError`, which the page mislabeled as an expired link (and swallowed the real
   error). Retry "worked" only because the client had hydrated by then. Fixed in code (not a
   dashboard change):
   - **Gate the form on a confirmed session** — on mount the page subscribes to
     `onAuthStateChange` and reads `getSession()`; a `checking → ready → no-session` state machine
     (2.5s grace timer) keeps Save disabled until the recovery session is live.
   - **Classify the error instead of blanket-labeling** — `src/lib/supabase/auth-errors.ts`
     (`classifyUpdatePasswordError` / `describeUpdatePasswordError`) splits `expired` vs
     `weak-password` vs `transient` vs `unknown` via the official `@supabase/supabase-js` guards.
     Transient/session-missing → **one transparent retry** (re-read session, retry `updateUser`), so
     the user's single tap now succeeds. Genuine expiry → accurate message + a "Request a new link"
     CTA back to `/forgot-password`. The real error is now `console.error`-logged (`[reset-password]`).
   - **Proxy no longer a second cookie-writer on the exchange** — `/auth/callback` excluded from the
     `src/proxy.ts` matcher; the callback route owns its own session there and proxy gating never
     applied to that path anyway.

---

## 8. Required Supabase dashboard config

Not in code — must be set in the project:
1. Auth → Providers → Email: enable **Confirm email**; **Email OTP length = 6**.
2. Email Templates → **Confirm signup**: body uses **`{{ .Token }}`** (6-digit code).
3. Email Templates → **Reset password**: link to
   `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
4. URL Configuration → **Site URL** = app origin; add `${SITE}/auth/callback` to the redirect allow-list.
5. SMTP: custom SMTP (Resend) — required for template editing and real deliverability. Disable
   click/open tracking on auth emails (a tracker wrapping a one-time link can consume it).

---

## 9. Verification status

| Flow | Status |
|---|---|
| signup → `handle_new_user` trigger → profile (with name) | ✅ verified in DB |
| 6-digit OTP verify | ✅ |
| routing gate: 0 memberships → `/onboarding` | ✅ |
| `create_business` → business + owner membership + owner-as-staff resource | ✅ verified in DB |
| reach `/dashboard` | ✅ |
| sign out → sign in → no onboarding bounce | ✅ |
| forgot → reset (token_hash recovery) | ✅ |
| reset first-save reliability (hydration-race fix, gotcha #9) | ⬜ code-complete; live re-test pending |
| `add_team_member` + invites | ⬜ not yet exercised (no teammate added) |
| cross-tenant RLS isolation | ⬜ needs a 2nd account |

The RLS chicken-and-egg fix is proven: a brand-new user with zero memberships created their
first business atomically through `create_business`.

---

## 10. What's left on the auth side

- **Invite-accept page** (`/invite/[token]` → `accept_invite`) — the RPC is ready; no UI yet.
  Also the only way to functionally test `add_team_member` + invites end to end.
- **Google / Apple SSO** — deferred out of V1 (buttons removed; `oauth-buttons.tsx` left on disk).
- **Subscription scaffold** (Foundation) — `status` enum + `trial_ends_at` + entitlements stub.
- **Onboarding remaining steps** — service, working-hours, go-live (slug + public URL) steps.
- **Cross-tenant RLS test** — second account to confirm isolation from the browser/anon client.
