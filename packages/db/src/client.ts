import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma client instance.
 *
 * In development, the client is cached on `globalThis` so that hot reloads do
 * not exhaust the database connection pool. In production a single instance is
 * created per process.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
