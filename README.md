# Bookedforreal

**Booking SaaS for hairdressers and barbers.** Clients book a haircut, beard trim or
coloring in **3 clicks max**; salon owners manage their services, staff and schedule in a
multi-tenant dashboard — on web and mobile.

- **UI**: ultra-simple, large buttons, accessible to everyone.
- **i18n**: French (default) and English.
- **Catalogue**: services grouped into price-list categories and assignable to specific
  staff (a service with nobody assigned is open to the whole team), with a per-hairdresser
  report of bookings and revenue.
- **Agenda**: a Monday–Sunday calendar where the owner confirms, completes or cancels an
  appointment in one click and blocks a slot (holiday, personal appointment) in another.
- **Client accounts**: the customer books with first name, last name, phone and email; a
  verification email confirms the inbox is real, then they can sign in with **Google** or a
  password to find their bookings across salons.
- **SEO-first**: SSR/SSG, translated metadata, structured data (JSON-LD), `sitemap.xml`,
  `robots.txt` and a 48-city local-SEO directory.
- **Billing**: Stripe subscriptions with a 7-day trial, a pay-as-you-go plan, two
  subscription tiers (Solo / Salon) and a quote-based tier for multi-shop groups.
- **Notifications**: WhatsApp first, automatic SMS fallback (both via Twilio). No email.
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
| `STRIPE_PRICE_USAGE` / `STRIPE_PRICE_SOLO` / `STRIPE_PRICE_SALON` / `STRIPE_PRICE_GROUP` | `api` | Stripe price IDs per plan (`USAGE` is metered) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | `api` | Twilio credentials for SMS + WhatsApp |
| `TWILIO_PHONE_NUMBER` / `TWILIO_WHATSAPP_NUMBER` | `api` | Twilio senders (E.164) |
| `TWILIO_CONTENT_CONFIRMATION` / `_REMINDER` / `_OWNER_ALERT` / `_TEST` | `api` | Approved WhatsApp templates (`HX…`); absent → SMS |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `api` / `web` | Google Sign-In OAuth client id (client accounts) |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` | `api` | Verification email (confirming the client's inbox) |
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
| CRUD | `/staff`, `/services`, `/availability`, `/appointments`, `/clients`, `/service-categories`, `/time-blocks` | Tenant-scoped management |
| GET | `/stats/dashboard` | Dashboard metrics |
| GET | `/stats/staff?from=&to=` | Per-hairdresser bookings and revenue |

## Billing (Stripe)

- `POST /billing/checkout` — starts a Checkout session for a plan (Usage / Solo / Salon).
- `POST /billing/portal` — opens the Customer Portal (cancel / update payment).
- `POST /webhooks/stripe` — syncs subscription state from
  `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
  `customer.subscription.deleted`.

Plans (see `apps/api/src/lib/plans.ts`). Public prices are **Solo €29/mo ex VAT** and
**Salon €59/mo ex VAT**; the first 50 salons get a **founding rate locked for life** at
**€19 / €39**. **Usage** = no subscription, **€0,50 per booking made online**, 1 staff,
SMS reminders only. Solo = 80 bookings/mo + 1 staff + WhatsApp reminders; Salon =
400 bookings/mo, 5 staff, 400 WhatsApp/SMS credits, custom domain and mobile app. Group =
unlimited shops, quote-based. Every plan starts with a 7-day free trial, no credit card
required — and **WhatsApp reminders are the up-sell from the pay-as-you-go plan to Solo**.

## Notifications

Appointment messages go out on **WhatsApp first, SMS as the automatic fallback** — no email.
In France a WhatsApp utility message costs roughly half a single-segment SMS, so the chain is
ordered by price and `sendWithFallback` walks it until one channel succeeds.

Three messages are queued per appointment (`apps/api/src/services/notifications.ts`):

| Message | Recipient | When |
| --- | --- | --- |
| `appointment.confirmation` | client | immediately after booking |
| `appointment.reminder` | client | 24 h before, skipped if the booking is closer |
| `appointment.owner_alert` | salon phone | immediately after booking |

A `Job` queue stores them; `worker.ts` processes them (run it every minute via cron).
Bodies and WhatsApp templates are rendered at send time, so a template approved later is
picked up by jobs already queued. A reminder is dropped when its appointment is cancelled.

Phone numbers are normalised to E.164 before use; a client without a dialable number simply
does not get a message. Each sent message consumes one credit from the plan quota
(50 / 100 / 400 / 2000).

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

## Documentation

| Doc | For | What it covers |
| --- | --- | --- |
| [`docs/DEMARRAGE-RAPIDE.md`](docs/DEMARRAGE-RAPIDE.md) | Onboarding a shop | The 6 steps to go live in 10 minutes, a 2-minute check, express troubleshooting |
| [`docs/STRIPE.md`](docs/STRIPE.md) | Billing setup | Prices to create, webhook, customer portal, tax |
| [`docs/GOOGLE_OAUTH.md`](docs/GOOGLE_OAUTH.md) | Client login | Google OAuth client for "Sign in with Google" |
| [`docs/NOTIFICATIONS.md`](docs/NOTIFICATIONS.md) | Messaging setup | WhatsApp + SMS via Twilio or Telnyx, templates, troubleshooting |
| `/{locale}/guide` | The shop owner | The same guide, published in the app |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Ops | Hosting, environment, migrations |
| [`docs/SEO.md`](docs/SEO.md) | Marketing | Technical SEO decisions |
| [`docs/MOBILE_BUILD.md`](docs/MOBILE_BUILD.md) | Ops | iOS / Android builds |

## Demo data

`pnpm db:seed` creates three demo salons (Paris · Lyon · Marseille) with services,
staff and weekly availability — enough to exercise the booking flow end-to-end at
`/fr/s/paris-marais/book`. Owner accounts use a placeholder password; create your own
account via `POST /auth/register` to manage a salon from the dashboard.
