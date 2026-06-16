# Tech Stack — Booking SaaS

The full stack for the multi-vertical booking platform. TypeScript end to end — every layer below shares inferred types from a single source.

---

## Language

- **TypeScript** everywhere — frontend, server actions, DB layer, validation
- `strict` mode on in `tsconfig.json` from day one (bundles `strictNullChecks` and friends; painful to retrofit later)

---

## Frontend

| Tool | Role |
|---|---|
| **Next.js (App Router)** | One app, rendering chosen per-route — marketing + public booking pages SSR, dashboard client-rendered |
| **React Query** | All server state — caching, invalidation, optimistic updates |
| **Tailwind + custom components over Radix primitives** | Headless primitives (dialogs, dropdowns, popovers) styled fully custom; you control every pixel |
| **cmdk** | Searchable select / combobox (Radix has no primitive for this) |
| **react-day-picker** | Date inputs on the dashboard (Radix has no date primitive) |
| **React Hook Form + Zod** | Forms and validation |
| **Zustand** | Client UI state only — wizard step, drawer open, filters. Never server data. |
| **Framer Motion** | Orchestrated transitions (booking wizard steps); Tailwind transitions for micro-interactions |

---

## Backend

| Tool | Role |
|---|---|
| **Next.js route handlers + server actions** | No separate backend service |
| **Inngest** | Scheduled / background jobs — reminders, trial-expiry, slot-hold cleanup (cancellable delayed jobs, not inline triggers) |

---

## Data

| Tool | Role |
|---|---|
| **Postgres on Supabase** | DB + Auth + Storage + row-level security in one |
| **Drizzle ORM** | Close to SQL — matters for non-trivial availability queries and the `EXCLUDE` constraint that prevents double-booking. Fully typed query results. |
| **Zod (shared)** | Same schema validates the client form and re-validates on the server — the "never trust the client's submitted slot" rule |

> The double-booking `EXCLUDE` constraint on `tstzrange` is defined in a **raw SQL migration** regardless of ORM — neither Drizzle nor Prisma expresses it natively, and that's fine.

---

## Billing & money

- **No customer payments** — money changes hands in person. No deposits, no Connect, no PCI scope.
- **Subscriptions via a merchant-of-record** (Paddle / Lemon Squeezy) — works from Albania, where Stripe doesn't support local accounts. *(Worth a closer look at pricing/features before committing.)*

---

## Infra

- **Hosting:** Vercel
- **Region:** Keep Vercel functions and the database in the **same EU region** (low latency to Albania) — a US-region DB behind EU functions adds latency to every query

---

## How TypeScript ties it together

The payoff is one source of truth for types:

1. Define a **Zod schema** once.
2. Infer the TS type with `z.infer`.
3. That type flows through the **form** (React Hook Form), **server validation**, and **function signatures** — no drift between client and server.
4. **Drizzle** generates types from your DB schema, so a column rename is a compile error, not a runtime surprise.
5. **React Query** infers data/error types from query functions, so components know the shape of what they render.
