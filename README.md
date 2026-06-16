# Orari

Multi-vertical booking SaaS. Money in person, software for the rest.

## Stack

TypeScript end to end. One source of truth for types via Zod + Drizzle.

- **Next.js 16 (App Router, Turbopack default)** — marketing + public booking SSR, dashboard client-rendered
- **React 19.2 + React Query** — server state
- **Tailwind + Radix primitives** styled fully custom (cmdk, react-day-picker fill gaps Radix doesn't)
- **React Hook Form + Zod** — forms, validated client AND re-validated server side
- **Zustand** — client UI state only (wizard step, drawers, filters)
- **Framer Motion** — wizard transitions
- **Supabase (Postgres + Auth + Storage + RLS)**
- **Drizzle ORM** — typed SQL-close queries
- **Inngest** — scheduled / cancellable background jobs
- **Paddle / Lemon Squeezy** — subscriptions (merchant-of-record; works from Albania)

## Setup

```bash
cp .env.example .env.local
pnpm install
pnpm db:generate     # generate SQL from src/db/schema.ts
pnpm db:migrate      # apply migrations
# then manually run src/db/migrations/0001_no_double_booking.sql
pnpm dev
```

## Folder layout

```
src/
  app/
    (marketing)/                 marketing pages
    (public)/book/[orgSlug]/     public booking page (SSR)
    (dashboard)/dashboard/       operator dashboard (client-rendered)
    api/inngest/                 Inngest function handler
  components/
    ui/                          custom-styled Radix primitives
    booking/                     booking wizard
    dashboard/                   dashboard widgets
  lib/
    env.ts                       Zod-validated env
    utils.ts                     cn() helper
    query-client.tsx             React Query provider
    schemas/                     shared Zod schemas
    supabase/                    server + browser clients
  db/
    client.ts                    Drizzle + postgres-js
    schema.ts                    Drizzle schema (source of truth)
    migrations/                  generated SQL + hand-written constraints
  server/
    actions/                     server actions ('use server')
    queries/                     server-only data fns
  hooks/                         React Query hooks
  stores/                        Zustand stores (UI only — never server data)
  inngest/                       background job definitions
  config/                        static config
  proxy.ts                       session refresh edge logic (renamed from middleware in Next 16)
```

## Notes

- **No customer payments.** No deposits, no Stripe Connect, no PCI scope. Money changes hands in person.
- **Double-booking is enforced in the DB**, not the app. See `src/db/migrations/0001_no_double_booking.sql` — a Postgres `EXCLUDE` constraint on `tstzrange` per staff member.
- **`proxy.ts`, not `middleware.ts`** — Next 16 renamed it. Runtime is `nodejs` (no edge).
- **Async request APIs everywhere** — `cookies()`, `headers()`, `params`, `searchParams` all return Promises in Next 16. Always `await`.
- **Region:** deploy Vercel functions and the DB in the same EU region. US-region DB behind EU functions adds latency to every query.

## Type flow

1. Zod schema in `src/lib/schemas/*` is the source of truth.
2. `z.infer` gives the TS type.
3. Same schema validates RHF on the client AND re-validates inside server actions.
4. Drizzle's `$inferSelect` / `$inferInsert` give DB row types — a column rename is a compile error.
5. React Query infers data shape from query functions; components never guess.
