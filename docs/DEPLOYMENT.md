# Bookedforreal — Deployment Guide

Production target: **O2switch** (Node.js + PostgreSQL) with **Cloudflare** in front,
and **Vercel** as the web fallback if O2switch Node.js support is insufficient.

## Architecture

```
Client ──> Cloudflare (DNS / CDN / WAF / SSL)
              │
              ├── bookedforreal.com  ──> Nginx ──> Next.js (PM2, :3000)
              ├── *.bookedforreal.com ──> Nginx ──> Next.js (same app)
              └── api.bookedforreal.com ──> Nginx ──> Fastify (PM2, :4000)
                                                        │
                                                        └──> PostgreSQL (O2switch) + pgBouncer
```

## 1. PostgreSQL (O2switch)

1. Create the database + user in the O2switch panel.
2. Enable **pgBouncer** (connection pooling) if the app scales beyond a handful of connections.
3. Daily backups — copy the cron line to the server:

   ```bash
   crontab -e
   # 0 3 * * * /home/USER/bookedforreal/deploy/backup-db.sh
   ```

   The script (`deploy/backup-db.sh`) keeps 14 days of `pg_dump -Fc` dumps.

## 2. API (Fastify) — O2switch Node.js App

```bash
# 1. Install Node.js via cPanel "Setup Node.js App" (or nvm)
# 2. Clone + install + build
git clone <repo> && cd bookedforreal
pnpm install --frozen-lockfile
pnpm build

# 3. Env
cp .env.production.example apps/api/.env   # fill DATABASE_URL, JWT_*, STRIPE_*, BREVO_*, TWILIO_*

# 4. PM2
npm i -g pm2
pm2 start deploy/ecosystem.config.cjs
pm2 save && pm2 startup
```

### Nginx reverse proxy + SSL

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bookedforreal
sudo ln -s /etc/nginx/sites-available/bookedforreal /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL (Let's Encrypt) — handles the cert + redirects automatically
sudo certbot --nginx -d api.bookedforreal.com -d bookedforreal.com -d www.bookedforreal.com -d '*.bookedforreal.com'
```

## 3. Web (Next.js)

Two options:

**A. O2switch (self-hosted)** — requires Node.js support:

```bash
# next.config.mjs already sets `output: "standalone"`.
pnpm --filter @bookedforreal/web build
# Serve via PM2 (ecosystem.config.cjs) using `next start` or the standalone server.
```

**B. Vercel (free fallback)** — recommended if O2switch Node.js is not available:

1. Import the repo in Vercel (root = repo, framework = Next.js).
2. `vercel.json` is already configured for the `apps/web` monorepo app.
3. Set the env vars below in the Vercel project.

### Salon subdomains (`*.bookedforreal.com`)

- DNS: add a wildcard `*.bookedforreal.com` A/CNAME record pointing at the server (or Vercel).
- The Next.js app reads `x-forwarded-host` (set by Nginx) to resolve the salon from the subdomain.

## 4. Mobile (EAS Build + Submit)

```bash
cd apps/mobile
npx eas login
npx eas build --platform all --profile production
npx eas submit --platform ios      # App Store
npx eas submit --platform android  # Play Store
```

Secrets: `EXPO_TOKEN` (or login), App Store Connect API key, Play Store service account.

## 5. Cloudflare

1. **DNS**: point `bookedforreal.com` + wildcard `*.bookedforreal.com` to the origin.
2. **SSL/TLS**: mode **Full (strict)**.
3. **CDN/cache**: cache static assets (`/_next/static/*`, `/_next/image/*`); bypass cache for `/api` and authenticated routes.
4. **WAF**: enable the managed ruleset + a rate-limiting rule for `/auth/*`.
5. **Page rules**: `api.bookedforreal.com/*` → cache bypass.

## 6. Monitoring

| Tool | Purpose | Setup |
|------|---------|-------|
| **Sentry** | Errors (web + API) | `SENTRY_DSN` env var; wire `@sentry/nextjs` / `@sentry/node` |
| **UptimeRobot** | Availability | Monitor `https://bookedforreal.com` + `https://api.bookedforreal.com/health` |
| **Umami** | Analytics | `NEXT_PUBLIC_UMAMI_WEBSITE_ID` + `NEXT_PUBLIC_UMAMI_URL` (self-hosted) |

## 7. Environment variables

All variables live in `.env.production.example`. Apply them to:
- `apps/api/.env` (Fastify + Prisma)
- `apps/web/.env.local` / Vercel project (Next.js)
- `apps/mobile` via `eas secret:create` (if needed)

## 8. Deployment checklist

- [ ] PostgreSQL created + pgBouncer enabled + cron backup active
- [ ] `.env` files filled on the server (no secrets committed)
- [ ] `pnpm build` succeeds on the server
- [ ] `prisma migrate deploy` applied
- [ ] PM2 running (`pm2 status` shows 2 apps online)
- [ ] Nginx configured + `nginx -t` passes + SSL issued (certbot)
- [ ] Cloudflare DNS + Full(strict) SSL + WAF on
- [ ] `/health` returns `{"status":"ok"}`
- [ ] `https://bookedforreal.com` loads, hreflang + JSON-LD present
- [ ] Subdomain `https://<salon>.bookedforreal.com` resolves
- [ ] Sentry DSN configured, UptimeRobot monitors, Umami tracking
- [ ] EAS production builds submitted to both stores

## 9. Rollback

```bash
# 1. Revert the release (tag or commit)
git checkout <previous-release-tag>

# 2. Rebuild + reload
pnpm install --frozen-lockfile && pnpm build
pm2 reload deploy/ecosystem.config.cjs

# 3. Rollback the database if the migration was destructive
pg_restore --clean --dbname "$DATABASE_URL" backups/bookedforreal-<timestamp>.dump

# 4. Vercel: redeploy the previous commit from the dashboard, or
#    vercel rollback
```

Rules:
- **Rollback code first**, then **database** (only if the migration was not backwards-compatible).
- Never roll back a migration that has already been applied to production data without a tested down-migration.
- Keep at least 14 days of backups (handled by `backup-db.sh`).
