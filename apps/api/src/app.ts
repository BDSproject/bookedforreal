import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import Fastify, { type FastifyInstance } from "fastify";

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

  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim());

  void app.register(cors, { origin: allowedOrigins });
  void app.register(helmet);
  void app.register(healthRoutes, { prefix: "/health" });
  void app.register(salonRoutes, { prefix: "/salons" });

  return app;
}
