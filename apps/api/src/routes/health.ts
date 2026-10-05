import type { FastifyInstance } from "fastify";

/** Liveness/readiness probe used by monitoring and load balancers. */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => ({
    status: "ok",
    service: "bookedforreal-api",
    timestamp: new Date().toISOString(),
  }));
}
