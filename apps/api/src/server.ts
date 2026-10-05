import "dotenv/config";

import { buildApp } from "./app";

const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";

const app = buildApp();

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`Bookedforreal API listening on http://${host}:${port}`);
  })
  .catch((error: unknown) => {
    app.log.error(error);
    process.exit(1);
  });
