import { z } from "zod";

// Client-safe environment. NEXT_PUBLIC_* vars are inlined by Next at build time
// ONLY when referenced as explicit static member expressions — never pass
// `process.env` wholesale here, or nothing gets inlined on the client and the
// parse fails in the browser.
const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const parsed = PublicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

if (!parsed.success) {
  console.error(
    "Invalid public environment variables:",
    z.treeifyError(parsed.error),
  );
  throw new Error("Invalid public environment variables");
}

export const publicEnv = parsed.data;
export type PublicEnv = z.infer<typeof PublicEnvSchema>;
