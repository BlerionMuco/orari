// Loads the same env Next reads, before any test module imports the db client
// (which validates env at import time). Pure unit tests don't touch the db, so
// this is a no-op for them.
import { config } from "dotenv";

config({ path: ".env.local" });
config();
