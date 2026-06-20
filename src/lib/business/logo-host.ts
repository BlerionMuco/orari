// Whether a logo URL's host is on the next/image remotePatterns allow-list
// (*.supabase.co over https). MUST mirror next.config.ts — extend both together.
// Pure and client-importable; returns false (never throws) on an unparseable URL
// so callers branch cleanly to the initials fallback. `next/image` throws on an
// unconfigured host, so this guard runs BEFORE rendering the image.
export function isAllowedLogoHost(url: string): boolean {
  let host: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    host = parsed.hostname.toLowerCase();
  } catch {
    return false;
  }
  // Apex alone isn't a storage host; require a real subdomain. A dot-boundary
  // check rejects look-alikes like "evil-supabase.co".
  if (host === "supabase.co") return false;
  return host.endsWith(".supabase.co");
}
