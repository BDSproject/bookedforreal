#!/usr/bin/env bash
# Zero-downtime-ish deploy for the O2switch Node.js server.
set -euo pipefail

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Applying database migrations"
pnpm --filter @bookedforreal/db exec prisma migrate deploy

echo "==> Building"
pnpm build

echo "==> Reloading PM2 processes"
pm2 reload deploy/ecosystem.config.cjs

echo "==> Saving PM2 process list"
pm2 save

echo "✅ Deploy complete"
