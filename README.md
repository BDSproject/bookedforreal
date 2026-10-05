# Bookedforreal

Booking SaaS for **hairdressers and barbers**. Customers book a haircut or shave in
**3 clicks max**; salon owners manage their services, stylists and schedule in a
multi-tenant dashboard.

- **UI**: ultra-simple, large buttons, accessible to everyone.
- **i18n**: French (default) and English.
- **SEO**: SSR/SSG, translated metadata, `sitemap.xml` and `robots.txt`.
- **Brand**: primary `#7C3AED` (violet), secondary `#FFFFFF` (white).

## Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Web        | Next.js 14 (App Router) · TypeScript strict · Tailwind · shadcn/ui |
| API        | Fastify 5 · Zod                                          |
| Data       | Prisma 6 · PostgreSQL 16                                 |
| Mobile     | Expo (React Native)                                      |
| i18n       | next-intl (FR/EN)                                        |
| Tooling    | pnpm workspaces · Prettier                                |

## Monorepo layout

```
apps/
  web/      Next.js web app (SSR/SSG, i18n, SEO)
  api/      Fastify HTTP API
  mobile/   Expo mobile app
packages/
  db/       Prisma schema + generated client
  config/   Shared TypeScript / Prettier presets
```

## Prerequisites

- Node.js **>= 20**
- pnpm **9** (see below for a hermetic bootstrap)
- Docker (for the local PostgreSQL)

### Bootstrap pnpm locally (no global install)

```bash
npm install --prefix ./.tools pnpm@9.15.4 --no-save --cache ./.npm-cache
./.tools/node_modules/.bin/pnpm --version
```

Then prefix every `pnpm` command with `./.tools/node_modules/.bin/`, or export it on
your `PATH`:

```bash
export PATH="$PWD/.tools/node_modules/.bin:$PATH"
```

## Getting started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Start PostgreSQL** (matches `docker-compose.yml` defaults)

   ```bash
   pnpm db:up
   ```

3. **Configure environment**

   ```bash
   cp .env.example packages/db/.env
   cp .env.example apps/api/.env
   cp .env.example apps/web/.env.local
   ```

4. **Generate the Prisma client and run the first migration**

   ```bash
   pnpm db:generate
   pnpm db:migrate -- --name init
   ```

5. **Run the apps**

   ```bash
   pnpm dev
   ```

   - Web: http://localhost:3000 (FR) · http://localhost:3000/en (EN)
   - API: http://localhost:4000/health
   - Mobile: Expo dev server

## Scripts

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `pnpm dev`           | Run web + api + mobile in watch mode          |
| `pnpm build`         | Build `db` first, then every other package    |
| `pnpm typecheck`     | Typecheck the whole monorepo                  |
| `pnpm lint`          | Lint every package                            |
| `pnpm format`        | Format the codebase with Prettier             |
| `pnpm db:up` / `db:down` | Start / stop the local PostgreSQL         |
| `pnpm db:generate`   | Generate the Prisma client                    |
| `pnpm db:migrate`    | Run a Prisma migration                        |
| `pnpm db:studio`     | Open Prisma Studio                            |

## Architecture notes

- **Multi-tenancy**: a `Salon` is the tenant boundary. Every tenant-scoped model
  (`User`, `Stylist`, `Service`, `Booking`, `Schedule`) references `salonId`, and
  public routes resolve the tenant by `slug` (e.g. `GET /salons/:slug`).
- **i18n routing**: `localePrefix: "as-needed"` keeps the default locale (`fr`)
  prefix-free for clean URLs; `en` is served under `/en`.
- **SEO**: `generateMetadata` is translated per locale, `sitemap.ts` and `robots.ts`
  are generated at build time, and each locale is statically rendered via
  `generateStaticParams`.
- **Currency/duration**: prices are stored in cents and durations in minutes to avoid
  floating-point issues.
