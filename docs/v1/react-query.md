# React Query (TanStack Query) Architecture — orari

> How server state / data fetching is structured. Read this before adding or editing any
> data hook. The canonical reference is the **booking** data layer
> (`src/lib/booking/query/`) — mirror it when adding a new entity.

## TL;DR

- Stack: **TanStack Query v5** over Next.js **server actions** + the public **route handler**
  (`/api/public/availability`) on Supabase/Drizzle. There is no GraphQL client — components
  never call `fetch`/actions directly, they call the hooks.
- Each entity's data layer lives in **`src/lib/<domain>/query/`** and is consumed via its
  barrel (`@/lib/booking/query`).
- **Reads** → `useQuery` (param-driven, with a `queryOptions` override). **Writes** →
  `useMutation` (invalidate the affected keys on settle; optimistic update only where a client
  cache list exists). Cache keys come from the central **`QUERY_KEYS`** map.

## Layer map

```
src/app/layout.tsx
  └─ <QueryProvider>                         src/lib/query/provider.tsx
        (one QueryClient; staleTime 60s, gcTime 5m, refetchOnWindowFocus:false, retry:false)
        └─ components
              └─ import { useAvailability, useCreateBooking } from "@/lib/booking/query"

src/lib/query/
  ├─ provider.tsx   ← QueryClient + QueryProvider (SSR-safe singleton)
  └─ keys.ts        ← QUERY_KEYS registry (add a key when an entity gains a query)

src/lib/booking/query/            ← one folder per domain (the reference impl)
  ├─ api.ts            ← the ONLY place the route / server actions are called
  ├─ types.ts          ← hook param / result types
  ├─ use-availability.ts   ← useQuery + availabilityQueryOptions factory
  ├─ use-create-booking.ts ← useMutation
  └─ index.ts          ← barrel
```

### Provider (`src/lib/query/provider.tsx`)
A single SSR-safe `QueryClient` wraps the whole app. Repo default: **`retry: false`** — a failed
query is not auto-retried; failures surface immediately and predictably.

### Keys (`src/lib/query/keys.ts`)
```ts
export const QUERY_KEYS = { AVAILABILITY: "availability" } as const;
```
Every query key is `[QUERY_KEYS.<ENTITY>, …discriminators]`. No inline string keys, no
speculative keys (add one when its first query lands).

## Worked example: booking

### `api.ts` — the I/O boundary
Plain functions; the only place the availability route and the booking actions are called.
No React here. Throws on a non-2xx fetch (so `useQuery` surfaces the error).
```ts
export async function fetchAvailability(p: FetchAvailabilityParams): Promise<AvailabilityResponse> { … }
export function createBooking(input: CreateBookingInput) { return createBookingAction(input); }
```

### `use-availability.ts` — read (param-driven)
A `useQuery` wrapper. Params in (no store coupling), `queryOptions` lets a caller override
`enabled`/`staleTime`/etc. The exported **`availabilityQueryOptions`** factory builds the key +
fn so the time-step read and the barber-step **prefetch** share the EXACT key (a prefetch on
the barber step is then a cache hit when the time step mounts).
```ts
export function availabilityQueryOptions(p) {
  return { queryKey: [QUERY_KEYS.AVAILABILITY, p.businessId, p.resourceId ?? RESOURCE_ANY, p.serviceIds.join(",")],
           queryFn: () => fetchAvailability(p), staleTime: 30_000 };
}
export function useAvailability(params: AvailabilityParams) {
  const query = useQuery({ ...availabilityQueryOptions(params), enabled: params.serviceIds.length > 0, ...params.queryOptions });
  // …derive days/slots/loading from query.data
}
```

### `use-create-booking.ts` — write
`useMutation` wrapping `api.createBooking`. `onSettled` invalidates the affected key
(`QUERY_KEYS.AVAILABILITY` — a booked or just-taken slot changes availability).
`onSuccess`/`onError` forward to the caller, which owns the UI (the wizard maps the result onto
its store). No optimistic update here: there is no client list to mutate.

### `index.ts` — barrel
Re-exports the hooks + the options factory + types. Components import only from here.

## Reads vs writes

- **Read:** component builds params (from its store/props) → `useAvailability(params)` (`useQuery`)
  → `api.fetchAvailability` → route → cached under `[QUERY_KEYS.AVAILABILITY, …]`.
- **Write:** component → `useCreateBooking().mutate(input, { onSuccess })` → `api.createBooking`
  → server action → `onSettled` invalidates availability → it refetches the truth.

## Optimistic update template (for the first list mutation — manage/dashboard)

Booking-create has no client list, so it just invalidates. When a **list** mutation lands
(cancel on the manage page, dashboard CRUD), use the full lifecycle:
```ts
useMutation({
  mutationFn: api.cancelBooking,
  onMutate: async (vars) => {                       // 1. optimistic
    await qc.cancelQueries({ queryKey });
    const previous = qc.getQueryData(queryKey);
    qc.setQueryData(queryKey, /* next */);
    return { previous };                            //    snapshot for rollback
  },
  onError: (_e, _v, ctx) => qc.setQueryData(queryKey, ctx?.previous), // 2. rollback
  onSettled: () => qc.invalidateQueries({ queryKey }),                // 3. refetch truth
});
```

## Conventions & gotchas

1. **Key shape.** Always `[QUERY_KEYS.<ENTITY>, …discriminators]`. A mutation invalidates the
   same prefix the read uses.
2. **api.ts is the only I/O.** Components/hooks never call `fetch`/actions directly.
3. **Param-driven hooks.** Read hooks take explicit params + a `queryOptions` override — they
   don't read a store internally (the component passes store values in).
4. **`retry: false`** globally — don't assume a transient failure auto-retries.
5. **Server-action types.** `startsAt` is a `Date` in `CreateBookingInput` (zod `coerce.date`);
   pass `new Date(slot.startUtc)`, not the ISO string.
6. **No toast yet.** Mutations forward `onSuccess`/`onError`; feedback is the store's
   `submitError` + `FormError`. A toast can drop into the hooks later without touching callers.

## Recipe: add a new entity (mirror booking)

1. Add `QUERY_KEYS.<ENTITY>` to `src/lib/query/keys.ts`.
2. Create `src/lib/<domain>/query/` with `api.ts` (fetchers / action wrappers), `types.ts`
   (params + results), `use-<entity>.ts` (useQuery and/or useMutation), `index.ts` (barrel).
3. Reads → `useQuery` (param-driven + `queryOptions`); writes → `useMutation` (invalidate the
   key; optimistic + rollback for list entities).
4. Consume via `import { useX } from "@/lib/<domain>/query"`.
