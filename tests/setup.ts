/**
 * Global test setup for vitest.
 * Loads environment variables and configures test database connection.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// Load .env file manually (avoids dotenv dependency)
function loadEnvFile(): void {
  try {
    const envPath = resolve(__dirname, "..", ".env");
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env file not found — rely on existing environment variables
  }
}

loadEnvFile();
process.env.NODE_ENV = "test";

// Export a read-only database connection for test queries
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for tests. Set it in .env or environment.");
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 3, // Keep pool small for tests
});

export const testDb = drizzle(pool);
export { pool as testPool };
