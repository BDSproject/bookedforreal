import { defineConfig } from "vitest/config";

/**
 * Test environment defaults. The auth integration tests require a running
 * PostgreSQL (see `pnpm db:up`); the connection string defaults to the local
 * Docker container published on port 5433.
 */
export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://bookedforreal:bookedforreal@localhost:5433/bookedforreal?schema=public",
      JWT_ACCESS_SECRET: "test-access-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
    },
  },
});
