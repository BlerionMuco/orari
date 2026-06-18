// Postgres error helpers shared by the booking insert paths. The driver surfaces
// SQLSTATE on `.code` and the violated constraint's name on `constraint_name`
// (postgres-js) or `constraint` — read both spellings so disambiguation is
// robust across drivers.

export function isPgError(e: unknown): e is { code: string } {
  return e instanceof Error && "code" in e;
}

export function pgConstraintName(e: unknown): string {
  if (e && typeof e === "object") {
    const rec = e as Record<string, unknown>;
    const v = rec.constraint_name ?? rec.constraint;
    if (typeof v === "string") return v;
  }
  return "";
}
