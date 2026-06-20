import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Business logos live in Supabase Storage's public-object path. Gated by
    // isAllowedLogoHost (src/lib/business/logo-host.ts) BEFORE reaching
    // next/image (which throws on an unconfigured host) — keep the two in sync.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
