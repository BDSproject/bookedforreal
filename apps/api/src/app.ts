import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import rawBody from "fastify-raw-body";

import { appointmentRoutes } from "./routes/appointments";
import { authRoutes } from "./routes/auth";
import { availabilityRoutes } from "./routes/availability";
import { billingRoutes, webhookRoutes } from "./routes/billing";
import { clientRoutes } from "./routes/clients";
import { healthRoutes } from "./routes/health";
import { notificationRoutes } from "./routes/notifications";
import { publicRoutes } from "./routes/public";
import { salonRoutes } from "./routes/salon";
import { serviceRoutes } from "./routes/services";
import { staffRoutes } from "./routes/staff";
import { statsRoutes } from "./routes/stats";

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
  void app.register(rawBody);
  // Rate limiting is opt-in per route via `config.rateLimit` (auth endpoints).
  void app.register(rateLimit, { global: false });

  void app.register(healthRoutes, { prefix: "/health" });
  void app.register(authRoutes, { prefix: "/auth" });
  void app.register(publicRoutes, { prefix: "/public" });
  void app.register(salonRoutes, { prefix: "/salons" });
  void app.register(staffRoutes, { prefix: "/staff" });
  void app.register(serviceRoutes, { prefix: "/services" });
  void app.register(availabilityRoutes, { prefix: "/availability" });
  void app.register(appointmentRoutes, { prefix: "/appointments" });
  void app.register(clientRoutes, { prefix: "/clients" });
  void app.register(statsRoutes, { prefix: "/stats" });
  void app.register(billingRoutes, { prefix: "/billing" });
  void app.register(webhookRoutes, { prefix: "/webhooks" });
  void app.register(notificationRoutes, { prefix: "/notifications" });

  return app;
}
