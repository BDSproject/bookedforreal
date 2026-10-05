import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm --filter @bookedforreal/api run start",
      url: "http://localhost:4000/health",
      reuseExistingServer: true,
      env: {
        DATABASE_URL: "postgresql://bookedforreal:bookedforreal@localhost:5433/bookedforreal?schema=public",
        JWT_ACCESS_SECRET: "e2e-access-secret",
        JWT_REFRESH_SECRET: "e2e-refresh-secret",
      },
    },
    {
      command: "pnpm --filter @bookedforreal/web run start",
      url: BASE_URL,
      reuseExistingServer: true,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
