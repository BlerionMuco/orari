# Core Booking Engine — Build Log

The availability engine — the correctness-critical core (timezones, DST, the double-booking race). Companion to [v1.md](./v1.md); sits on top of the access layer in [auth.md](./auth.md).

Three deliverables, all shipped: `getAvailableSlots()`, the booking-creation transaction, and timezone correctness. The public booking wizard UI is a separate phase that **consumes** this engine.

**Design spine:** all pure logic (slot math, tz/DST) is IO-free and unit-tested; Drizzle is isolated in `queries.ts`; the Postgres `EXCLUDE` constraint is the single source of truth for the race, with a cheap server-side re-validate in front of it.

---

## 1. Schema changes (migrations 0005 + 0006)

### `0005_cute_patch.sql` (Drizzle-generated, additive)
- `services` += `before_buffer_min`, `after_buffer_min` (int, default 0).
- `bookings` += `before_buffer_min`/`after_buffer_min` (snapshot of the service buffers at creation), `manage_token` (text, unique — tokenized manage link), `idempotency_key` (text, unique, nullable).
- New `booking_rules` — `lead_time_min` (120), `advance_window_days` (60), `slot_granularity_min` (15), scoped by `business_id` with an optional `service_id` override (partial unique `WHERE service_id IS NULL` = the business default).
- New `outbox` — `type`, `payload jsonb`, `processed_at` (partial index on unprocessed rows).
- `time_off` += `business_id` (nullable here), and `resource_id` made **nullable** (NULL = business-wide closure).

### `0006_core_engine.sql` (hand-written — Drizzle can't express these)
- `time_off.business_id` backfilled from the resource, then `SET NOT NULL`. A NULL-`resource_id` closure has no resource FK to carry the business link, so it needs its own `business_id`.
- `bookings.reserved_range tstzrange` maintained by a **trigger** (`set_reserved_range`), not a `GENERATED` column: `timestamptz ± interval` is STABLE, not IMMUTABLE, so a STORED generated column is rejected. The trigger recomputes `[starts_at − before, ends_at + after)` on insert **and** on reschedule.
- **Constraint swap**: dropped the 0002 `bookings_no_overlap` (on `tstzrange(starts_at, ends_at)`) and re-added it on the buffer-inclusive `reserved_range`. 0002 was already per-resource; this only changes *which* range is guarded, so the DB now also enforces buffer separation. Statuses stay `held, confirmed`.

**Reconciliation notes (flagged):**
- `btree_gist` was already installed by 0001 (0002 already used it); the `CREATE EXTENSION IF NOT EXISTS` in 0006 is an idempotent guard — confirmed at migrate time by a `already exists, skipping` NOTICE.
- `working_hours` keeps integer `start_minute`/`end_minute` (equivalent to the spec's `start_time`/`end_time`); multiple rows per weekday = split shifts; `end_minute > 1440` = overnight spill.
- `reserved_range` is **intentionally not modeled** in `schema.ts` — its only consumer is the EXCLUDE constraint. The engine recomputes busy intervals from the snapshotted buffer columns, so reading the range back (parsing a `tstzrange` literal) is unnecessary.
- `time_off` joins `TENANT_TABLES` in `scoped.ts` (it now carries `business_id`), so business-wide closures are tenant-scoped.

---

## 2. Modules — `src/lib/booking/`

| File | Responsibility |
|---|---|
| `types.ts` | Domain types (`BookingRules`, `WorkingWindow`, `BusyInterval`, `Slot`, `SlotValidationInput`, …). UTC `Date` instants; integer `*Min`. |
| `constants.ts` | `DEFAULT_BOOKING_RULES`, `MINUTES_PER_DAY`, `MAX_AVAILABILITY_RANGE_DAYS` (60). |
| `time.ts` | **Pure** tz/DST math over `@date-fns/tz` (`TZDate` + `tz()`). |
| `availability.ts` | **Pure** slot generation + set-membership `validateSlot`. `now` injected. |
| `queries.ts` | **Only** Drizzle surface (reads + outbox helpers). |
| `get-available-slots.ts` | Orchestration (load → pure generate). |
| `create-booking.ts` | The mutation core. |

Plus: server action `src/app/(public)/book/actions.ts`, route handler `src/app/api/public/availability/route.ts`, outbox drainer in `src/inngest/functions/outbox.ts`, seed `src/db/seeds/booking.ts`.

---

## 3. Timezone correctness (`time.ts`)

UTC `timestamptz` storage; business tz is an IANA name; `now` is injected (no clock in pure code). `localPartsToUtc(isoDate, minuteOfDay, tz)` is the one wall-clock → UTC conversion, with an explicit round-trip guard.

Verified `@date-fns/tz@1.5.0` behavior (drove the design):
- `new TZDate(y, monthIndex, d, h, min, zone)` reads parts as wall-clock; `.getTime()` is the UTC instant.
- **Spring-forward gap** (e.g. 02:30 on the DST day) is rolled forward by the lib → the round-trip of the wall clock no longer matches → reported `existed: false` (generation skips it; create rejects `nonexistent-local-time`).
- **Fall-back ambiguity** resolves to the **earlier** occurrence — exactly the rule we want, no extra probing.

23h/25h days fall out automatically because candidates are walked as `isoDate + minuteOfDay` through `localPartsToUtc`. Overnight windows use `minuteOfDay > 1440`, spilling into the next local day.

---

## 4. `getAvailableSlots()` (`availability.ts`)

Pure, per day per resource — layered subtraction expressed as two per-candidate checks (equivalent, cheaper):

1. Working windows for the weekday (split shifts; overnight).
2. − business closures (`time_off` with `resource_id IS NULL`).
3. − resource time-off.
4. − existing bookings, each buffer-expanded via its snapshotted buffers (mirrors `reserved_range`).
5. Candidates at `slot_granularity_min`; kept only if the candidate's reserved range `[start − before, start + duration + after)` fits inside the window **and** overlaps no busy interval (half-open `[)`, so back-to-back at buffer 0 is allowed) **and** satisfies lead time / advance window.

`validateSlot` (used by create) is **set membership**, not loose predicates: it regenerates the day's slots and asserts the exact instant is one of them — so a start the generator would never emit (e.g. a window opening at 09:07) is rejected cleanly before the constraint.

---

## 5. Booking creation (`create-booking.ts`)

`createBooking(input)` → discriminated `CreateBookingResult`:
1. Idempotent replay: a repeated `idempotency_key` returns the existing booking.
2. Tenant-load context; re-derive `endsAt` from `service.durationMin`; snapshot the service buffers.
3. Re-validate the slot (set membership).
4. Transaction: insert `status='confirmed'` (+ `manage_token`, buffers, key) **and** an `outbox` row (`booking_confirmed`) — same transaction.
5. Catch by SQLSTATE: `23P01` (exclusion) → `slot-taken`; `23505` disambiguated by constraint name — `idempotency` → return existing, `manage_token` → regenerate + retry once. (postgres-js exposes `constraint_name`; the code reads `constraint_name ?? constraint` defensively.)

Side effects never run inline. The **outbox drainer** (Inngest cron, ~1/min) re-emits `booking/confirmed` (which schedules the reminder) and marks rows processed — so a rollback can't orphan a sent email and a failed send can't roll back the booking.

The `"use server"` action `createBookingAction` maps the result to the repo's `{ error?; booking? }` convention.

**Availability route** `GET /api/public/availability` — public, cacheable; resolves `businessId` from `orgSlug`, clamps the `from`/`to` span to `MAX_AVAILABILITY_RANGE_DAYS` (CPU guard on the anon endpoint), returns `{ timezone, slots }`.

**Confirm-only for V1.** No holds — the EXCLUDE constraint makes double-booking impossible without them. `held` stays reserved in the constraint for a future deposits-driven hold step.

---

## 6. Tests

- **Pure unit (Vitest, `__tests__/{time,availability}.test.ts`)** — 32 tests, no DB. DST spring-forward gap / fall-back, round-trip identity, overnight, lead/advance cutoffs, buffers, half-open boundary, split shifts, empty hours, set-membership validation. Run: `pnpm test:run`.
- **Integration (`create-booking.integration.test.ts`)** — gated by `RUN_DB_TESTS`, against a **throwaway Postgres** (true concurrency needs two real connections, so a transaction-rollback can't test the race). Creates an isolated temp business and tears it down. Proves: confirmed booking + outbox row, idempotent replay, re-validate rejects a taken slot, zero-buffer adjacency, cancel→rebook, and the **23P01 concurrent race** (two overlapping inserts on a 2-connection client → exactly one survives). Run: `RUN_DB_TESTS=1 DATABASE_URL=… pnpm vitest run create-booking.integration`.

Vitest resolves `@/` and stubs `server-only` (see `vitest.config.ts`).

---

## 7. Verification status

| Check | Status |
|---|---|
| 0005 + 0006 applied to dev DB; constraint on `reserved_range`, trigger live, `time_off.business_id` NOT NULL | ✅ verified via introspection |
| Pure DST / slot suite | ✅ 32 passing |
| Integration: create + outbox, idempotency, re-validate, adjacency, cancel→rebook, **23P01 race** | ✅ 6 passing against real Postgres |
| Temp-business teardown leaves no orphans | ✅ verified |

---

## 8. What's left / follow-ups

- **Seed before manual use:** onboarding doesn't create services / working_hours / a `booking_rules` row yet, so the engine falls back to `DEFAULT_BOOKING_RULES`. Wire a default-rules insert into `create_business`, and add the service/hours onboarding steps. `pnpm tsx src/db/seeds/booking.ts` seeds the existing business for manual testing.
- **Outbox drainer is a re-emitter** — it sends `booking/confirmed`; the actual confirmation email + reminder delivery land with the notifications phase.
- **Service↔resource capability** mapping deferred (V1 = one resource; the engine takes candidate `resources[]` so it's a localized add).
- **RLS** on `booking_rules` / `outbox` only needed if reached by the browser/anon path (the engine uses the privileged Drizzle client).
- **Hold-then-confirm** deferred to deposits (short TTL, release on confirm AND explicit abandon).
- The booking wizard UI (service → resource → time picker → guest form → confirmation) consumes `getAvailableSlots()` + `createBookingAction()`.
