import "dotenv/config";

import { buildApp } from "./app";

const app = buildApp();

// `PORT` is injected by Passenger-style hosts (O2switch Node.js Selector,
// Railway, Render, Heroku…); `API_PORT` remains the local/dev convention.
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";

app
  .listen({ port, host })
  .then(() => {
    app.log.info(`Bookedforreal API listening on http://${host}:${port}`);
  })
  .catch((error: unknown) => {
    app.log.error(error);
    process.exit(1);
  });
