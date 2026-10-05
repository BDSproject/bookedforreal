import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";

import { authRoutes } from "./routes/auth";
import { healthRoutes } from "./routes/health";
import { salonRoutes } from "./routes/salons";

/**
 * Builds and configures the Fastify application without binding a port,
 * so it can be reused in tests.
 */
export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:8081")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  // CORS: web (Next.js) + mobile web preview. `credentials` allows httpOnly cookies.
  void app.register(cors, { origin: allowedOrigins, credentials: true });
  void app.register(helmet);
  void app.register(cookie);
  // Rate limiting is opt-in per route via `config.rateLimit` (auth endpoints).
  void app.register(rateLimit, { global: false });

  void app.register(healthRoutes, { prefix: "/health" });
  void app.register(salonRoutes, { prefix: "/salons" });
  void app.register(authRoutes, { prefix: "/auth" });

  return app;
}
