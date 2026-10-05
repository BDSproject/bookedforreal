import "dotenv/config";

import { prisma } from "@bookedforreal/db";

import { processDueJobs } from "./services/notifications";

/**
 * Notification worker. Runs due jobs once (call every minute via cron):
 *   * * * * * node dist/worker.js
 */
async function run(): Promise<void> {
  const handled = await processDueJobs();
  if (handled > 0) {
    console.log(`Worker processed ${handled} job(s).`);
  }
}

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
