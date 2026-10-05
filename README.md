# Bookedforreal

Booking SaaS for **hairdressers and barbers**. Customers book a haircut or shave in
**3 clicks max**; salon owners manage their services, stylists and schedule in a
multi-tenant dashboard.

- **UI**: ultra-simple, large buttons, accessible to everyone.
- **i18n**: French (default) and English.
- **SEO**: SSR/SSG, translated metadata, `sitemap.xml` and `robots.txt`.
- **Brand**: primary `#7C3AED` (violet), secondary `#FFFFFF` (white).

## Stack

| Layer     | Technology                                                          |
| --------- | ------------------------------------------------------------------- |
| Web       | Next.js 14 (App Router) · TypeScript strict · Tailwind · shadcn/ui   |
| API       | Fastify 5 · Zod                                                     |
| Data      | Prisma 6 · PostgreSQL 16                                            |
| Mobile    | Expo (React Native)                                                 |
| i18n      | next-intl (FR/EN)                                                   |
| Monorepo  | Turborepo · pnpm workspaces · Prettier                              |

## Monorepo layout

```
apps/
  web/      Next.js web app (SSR/SSG, i18n, SEO)
  api/      Fastify HTTP API
  mobile/   Expo mobile app
packages/
  ui/       Shared shadcn/ui React components (Button, cn, …)
  db/       Prisma schema + generated client
  config/   Shared tsconfig / Tailwind / ESLint / Prettier presets
  i18n/     FR/EN translations + locale metadata
  types/    Shared Zod schemas + inferred types
```

## Prerequisites

- Node.js **>= 20**
- pnpm **9** (see below for a hermetic bootstrap)
- Docker (for the local PostgreSQL)

### Bootstrap pnpm locally (no global install)

```bash
npm install --prefix ./.tools pnpm@9.15.4 --no-save --cache ./.npm-cache
export PATH="$PWD/.tools/node_modules/.bin:$PATH"
```

## Getting started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start PostgreSQL** (published on host port `5433` to avoid clashing with a local install)

   ```bash
   pnpm db:up
   ```

3. **Configure environment**

   ```bash
   cp .env.example packages/db/.env
   cp .env.example apps/api/.env
   cp .env.example apps/web/.env.local
   ```

4. **Generate the Prisma client, run the first migration and seed demo data**

   ```bash
   pnpm db:generate
   pnpm db:migrate        # prompts for a migration name (e.g. "init")
   pnpm db:seed
   ```

5. **Build once** (compiles shared packages before starting the dev servers)

   ```bash
   pnpm build
   ```

6. **Run the apps**

   ```bash
   pnpm dev
   ```

   - Web: http://localhost:3000 (FR) · http://localhost:3000/en (EN)
   - API: http://localhost:4000/health
   - Mobile: Expo dev server

## Scripts (Turborepo)

| Command              | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `pnpm dev`           | Run `dev` tasks (apps + package watchers)                    |
| `pnpm build`         | Build packages first (`^build`), then apps — turbo-cached    |
| `pnpm typecheck`     | Typecheck every package/app — turbo-cached                   |
| `pnpm test`          | Run tests (Vitest) — turbo-cached                            |
| `pnpm lint`          | Lint every package/app — turbo-cached                        |
| `pnpm clean`         | Remove build outputs (`dist`, `.next`, …)                    |
| `pnpm format`        | Format the codebase with Prettier                            |
| `pnpm db:up` / `db:down` | Start / stop the local PostgreSQL                        |
| `pnpm db:generate`   | Generate the Prisma client                                   |
| `pnpm db:migrate`    | Run a Prisma migration                                       |
| `pnpm db:seed`       | Seed the database with a demo salon                          |
| `pnpm db:studio`     | Open Prisma Studio                                           |

Turborepo caches task outputs in `node_modules/.cache/turbo`; re-running unchanged
builds is near-instant.

## Architecture notes

- **Multi-tenancy**: a `Salon` is the tenant boundary. Every tenant-scoped model
  (`User`, `Stylist`, `Service`, `Booking`, `Schedule`) references `salonId`, and
  public routes resolve the tenant by `slug` (e.g. `GET /salons/:slug`).
- **Shared packages**: `@bookedforreal/ui` (shadcn components), `@bookedforreal/i18n`
  (translations + locale list), `@bookedforreal/types` (Zod schemas) are compiled to
  `dist` and consumed by the apps. `@bookedforreal/config` is referenced by path and
  holds the tsconfig/Tailwind/ESLint/Prettier presets.
- **Package alias**: every app's `tsconfig.json` maps the `@bookedforreal/*` scope to
  `packages/*` via `paths`, so imports resolve consistently across web, api and mobile.
- **i18n routing**: `localePrefix: "as-needed"` keeps the default locale (`fr`)
  prefix-free for clean URLs; `en` is served under `/en`.
- **SEO**: `generateMetadata` is translated per locale, `sitemap.ts` and `robots.ts`
  are generated at build time, and each locale is statically rendered via
  `generateStaticParams`.
- **Currency/duration**: prices are stored in cents and durations in minutes to avoid
  floating-point issues.
