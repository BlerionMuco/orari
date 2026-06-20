// Central registry of React Query cache keys. Every entity that has a query
// owns a key here, so reads and the writes that invalidate them reference one
// source instead of scattered string literals. See docs/v1/react-query.md.
// Add a key when an entity gains its first query (no speculative keys).
export const QUERY_KEYS = {
  AVAILABILITY: "availability",
} as const;

export type QueryKeyName = (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS];
