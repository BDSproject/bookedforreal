# Bookedforreal

**Booking SaaS for hairdressers and barbers.** Clients book a haircut, beard trim or
coloring in **3 clicks max**; salon owners manage their services, staff and schedule in a
multi-tenant dashboard — on web and mobile.

- **UI**: ultra-simple, large buttons, accessible to everyone.
- **i18n**: French (default) and English.
- **SEO-first**: SSR/SSG, translated metadata, structured data (JSON-LD), `sitemap.xml`,
  `robots.txt` and a 48-city local-SEO directory.
- **Billing**: Stripe subscriptions with a 7-day trial, a Starter / Pro plan and a
  quote-based tier for multi-shop groups.
- **Notifications**: email (Brevo), SMS & WhatsApp (Twilio / Meta), with a fallback chain.
- **Brand**: primary `#7C3AED` (violet), secondary `#FFFFFF` (white).

## Stack

| Layer     | Technology                                                             |
| --------- | ---------------------------------------------------------------------- |
| Web       | Next.js 14 (App Router) · TypeScript strict · Tailwind · shadcn/ui      |
| API       | Fastify 5 · Zod · Argon2id · JWT                                         |
| Data      | Prisma 6 · PostgreSQL (Neon serverless, or local Docker)                |
| Mobile    | Expo (React Native)                                                    |
| i18n      | next-intl (FR/EN)                                                       |
| Billing   | Stripe (Checkout, Customer Portal, webhooks)                            |
| Notify    | Brevo (email) · Twilio (SMS/WhatsApp) · Meta WhatsApp · push fallback   |
| Monorepo  | Turborepo · pnpm workspaces · Prettier · Vitest · Playwright            |

## Monorepo layout

```
apps/
  web/      Next.js web app (SSR/SSG, i18n, SEO)
  api/      Fastify HTTP API
  mobile/   Expo mobile app
packages/
  ui/       Shared shadcn/ui React components (Button, Card, Input, …)
  db/       Prisma schema + generated client + seed
  config/   Shared tsconfig / Tailwind / ESLint / Prettier presets
  i18n/     FR/EN translations + locale metadata
  types/    Shared Zod schemas + inferred types
```

## Prerequisites

- Node.js **>= 20**
- pnpm **9** (bootstrap below, no global install needed)
- Docker (optional — only for the local PostgreSQL fallback)

### Bootstrap pnpm locally

```bash
npm install --prefix ./.tools pnpm@9.15.4 --no-save --cache ./.npm-cache
export PATH="$PWD/.tools/node_modules/.bin:$PATH"
```

## Getting started

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Set the database URL** (Neon is the default target; local Docker is a fallback)

   ```bash
   cp .env.example packages/db/.env
   cp .env.example apps/api/.env
   cp .env.example apps/web/.env.local
   ```

   Set `DATABASE_URL` in `packages/db/.env` (and `apps/api/.env` +
   `apps/web/.env.local`) to a Neon **direct** connection string, e.g.

   ```
   DATABASE_URL="postgresql://<user>:<password>@ep-<id>.<region>.aws.neon.tech/<db>?sslmode=require"
   ```

   (Find it in the Neon dashboard → **Connect**. Keep `sslmode=require`.)

3. **Apply migrations and seed demo data**

   ```bash
   pnpm db:generate
   pnpm db:migrate:deploy   # applies existing migrations (no prompt)
   pnpm db:seed             # 3 demo salons: Paris, Lyon, Marseille
   ```

   > `pnpm db:migrate` is for creating a **new** migration during development.

4. **Build once** (compiles shared packages before running the apps)

   ```bash
   pnpm build
   ```

5. **Run the apps**

   ```bash
   pnpm dev
   ```

   - Web FR: <http://localhost:3000/fr> · Web EN: <http://localhost:3000/en>
   - API: <http://localhost:4000/health>

### Local PostgreSQL fallback

```bash
pnpm db:up          # docker compose up -d postgres (host port 5433)
# DATABASE_URL="postgresql://bookedforreal:bookedforreal@localhost:5433/bookedforreal?schema=public"
```

## Environment variables

Copy `.env.example` to the relevant package(s). Grouped below by concern.

| Variable | Used by | Description |
| --- | --- | --- |
| `DATABASE_URL` | `db`, `api`, `web` | Prisma connection string (Neon or local Postgres) |
| `NEXT_PUBLIC_APP_URL` | `web` | Public site URL (metadata, sitemap, robots, OG) |
| `NEXT_PUBLIC_API_URL` | `web` | API base URL the browser calls |
| `API_HOST` / `API_PORT` | `api` | Fastify bind host / port (default `0.0.0.0` / `4000`) |
| `CORS_ORIGIN` | `api` | Comma-separated allowed origins |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | `api` | JWT signing keys (access 15 min / refresh 30 d) |
| `STRIPE_SECRET_KEY` | `api` | Stripe secret key (`sk_test_…` / `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | `api` | Webhook signing secret (`whsec_…`) |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` | `api` | Stripe price IDs per plan |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` | `api` | Email notifications (Brevo) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | `api` | SMS / WhatsApp (Twilio) |
| `META_WHATSAPP_TOKEN` | `api` | WhatsApp via Meta (optional channel) |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` / `NEXT_PUBLIC_UMAMI_URL` | `web` | Analytics (Umami, optional) |

**Never commit secrets.** `.env`, `.env.local` and `.env.*.local` are gitignored; only
`.env.example` (placeholders) is tracked. In CI / hosting, set these as **GitHub
secrets** or environment variables — e.g. `DATABASE_URL` is already a repo secret.

## Scripts (Turborepo)

| Command | Description |
| --- | --- |
| `pnpm dev` | Run `dev` tasks (apps + package watchers) |
| `pnpm build` | Build packages first (`^build`), then apps — turbo-cached |
| `pnpm typecheck` | Typecheck every package/app |
| `pnpm test` | Run tests (Vitest) |
| `pnpm lint` | Lint every package/app |
| `pnpm format` / `pnpm format:check` | Format / check with Prettier |
| `pnpm clean` | Remove build outputs (`dist`, `.next`, …) |
| `pnpm db:up` / `pnpm db:down` | Start / stop the local PostgreSQL |
| `pnpm db:generate` | Generate the Prisma client |
| `pnpm db:migrate` | Create a new Prisma migration |
| `pnpm db:migrate:deploy` | Apply existing migrations (CI / deploy) |
| `pnpm db:seed` | Seed demo salons (idempotent) |
| `pnpm db:studio` | Open Prisma Studio |

## Architecture notes

- **Multi-tenancy**: `Salon` is the tenant boundary. Tenant-scoped models (`Staff`,
  `Service`, `Availability`, `Client`, `Appointment`, `Review`, `Page`,
  `Subscription`) reference `salonId`; public routes resolve the tenant by `slug`.
  `User` is platform-wide (auth/ownership).
- **Shared packages**: `@bookedforreal/ui`, `@bookedforreal/i18n`,
  `@bookedforreal/types` compile to `dist`; `@bookedforreal/config` is referenced by
  path (tsconfig/Tailwind/ESLint/Prettier presets). Apps map `@bookedforreal/*` to
  `packages/*` via `paths`.
- **i18n routing**: `localePrefix: "always"` — `/fr` is the default, `/en` the English
  version; `x-default` hreflang points at French.
- **Currency/duration**: prices are stored in cents, durations in minutes.
- **Trial**: every new salon gets a **7-day** free trial (`trialEndsAt`), cancellable
  at any time; the remaining days are forwarded to Stripe (`trial_period_days`).

## Auth API

Passwords are hashed with **Argon2id**; sessions use **JWT** access (15 min) + refresh
(30 d) tokens in httpOnly cookies.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/register` | Creates a `User` (OWNER) + `Salon` (7-day trial, all plans) |
| POST | `/auth/login` | Issues access + refresh tokens |
| POST | `/auth/refresh` | Rotates the access token from the refresh cookie |
| POST | `/auth/logout` | Clears both cookies |
| GET | `/auth/me` | Returns the current user |

Login/register are rate-limited (5 attempts / 15 min). `requireAuth` / `requireRole` /
`requireSalon` pre-handlers guard protected routes.

## Booking API

**Public (client-facing, resolved by salon `slug`)**

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/public/salons/:slug` | Salon mini-site (services, staff, availability, reviews) |
| GET | `/public/salons/:slug/availability` | Free 15-min slots for a date/service/staff |
| POST | `/public/salons/:slug/appointments` | Create a booking (double-booking safe) |

**Authenticated (owner dashboard)**

| Method | Endpoint | Description |
| --- | --- | --- |
| CRUD | `/staff`, `/services`, `/availability`, `/appointments`, `/clients` | Tenant-scoped management |
| GET | `/stats/dashboard` | Dashboard metrics |

## Billing (Stripe)

- `POST /billing/checkout` — starts a Checkout session for a plan (Starter / Pro).
- `POST /billing/portal` — opens the Customer Portal (cancel / update payment).
- `POST /webhooks/stripe` — syncs subscription state from
  `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
  `customer.subscription.deleted`.

Plans (see `apps/api/src/lib/plans.ts`): **Starter** (30 bookings/mo, 1 staff),
**Pro** (300 bookings/mo, 5 staff, 100 SMS/WhatsApp credits), and **Sur devis** (custom
quote for multi-shop / premium clients).

## Notifications

A `Job` queue stores due notifications; `worker.ts` processes them via a fallback chain:

`email (Brevo) → SMS (Twilio) → WhatsApp (Twilio/Meta) → push`.

Quotas (e.g. SMS credits) are enforced per plan.

## SEO

- SSR/SSG with translated `<title>`, `<meta description>`, canonical + hreflang.
- OpenGraph + Twitter cards with a generated default image (`/[locale]/opengraph-image`).
- JSON-LD: `Organization`, `WebSite`, `SoftwareApplication`, `HairSalon`/`BarberShop`,
  `FAQPage`, `BreadcrumbList`, `Article`, `ItemList`.
- Dynamic `sitemap.xml` (salons + 48 cities × coiffeur/barber × locales) and `robots.txt`
  (`noindex` on auth/dashboard/booking).
- Programmatic local pages: `/coiffeur/<city>`, `/barber/<city>`, `/coiffeur/<city>/<district>`.

## Testing

- **Unit / integration**: Vitest — API (86%+), web, types, i18n, ui.
- **E2E**: Playwright (`apps/web/e2e/booking.spec.ts`).
- **Mobile**: Maestro flows (`.maestro/`).

```bash
pnpm test
pnpm --filter @bookedforreal/api run test:coverage   # coverage gate
pnpm --filter @bookedforreal/web run test:e2e        # Playwright
```

## CI / CD

`.github/workflows/ci.yml` runs on PRs and `main`: lint → typecheck → tests →
coverage gate, then preview/production deploys (Vercel for web, EAS for mobile).

## Deployment

- **Web**: Vercel, or self-hosted (O2switch) via `output: "standalone"` + PM2/Nginx —
  see `docs/DEPLOYMENT.md` and `deploy/`.
- **Database**: Neon (serverless Postgres). Point the hosting `DATABASE_URL` to Neon
  and run `pnpm db:migrate:deploy` once.
- **API**: Node server (`apps/api/dist/server.js`) behind a reverse proxy.

## Demo data

`pnpm db:seed` creates three demo salons (Paris · Lyon · Marseille) with services,
staff and weekly availability — enough to exercise the booking flow end-to-end at
`/fr/s/paris-marais/book`. Owner accounts use a placeholder password; create your own
account via `POST /auth/register` to manage a salon from the dashboard.
