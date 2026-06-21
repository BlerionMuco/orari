// Pure slug helpers — no DB, no IO, client-importable (used by the go-live step's
// auto-fill + input sanitizer and re-validated in the server action).

// Public booking slugs that would collide with real routes or are otherwise
// reserved. Union of actual route segments and product-reserved words.
const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "app",
  "www",
  "book",
  "orari",
  "dashboard",
  "login",
  "signup",
  "sign-in",
  "sign-up",
  "onboarding",
  "invite",
  "auth",
  "manage",
  "forgot-password",
  "reset-password",
  "verify",
  "public",
  "help",
  "about",
  "settings",
  "new",
  "support",
  "account",
  "billing",
]);

// Derive a URL slug from a business name. Diacritics are decomposed (NFD) and
// their combining marks dropped, so Albanian/Latin letters fold to ASCII
// (ë→e, ç→c). Non-alphanumerics collapse to single hyphens; result is trimmed
// and capped at 40 chars. Falls back to "shop" when nothing survives.
export function slugify(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, ""); // a trailing hyphen can appear after the 40-char cut
  return base.length > 0 ? base : "shop";
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export function isValidSlugFormat(slug: string): boolean {
  return (
    slug.length >= 3 &&
    slug.length <= 40 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  );
}
