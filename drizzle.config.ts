import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js reads .env.local; load it here so drizzle-kit sees the same vars.
config({ path: ".env.local" });
config(); // fall back to .env

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
