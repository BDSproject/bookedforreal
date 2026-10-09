#!/usr/bin/env bash
# Builds self-contained bundles for O2switch mutualisé (Passenger + npm).
#
# O2switch runs Node via Phusion Passenger and installs dependencies with NPM,
# so the pnpm/TypeScript monorepo must be BUILT LOCALLY and uploaded as two
# ready-to-run folders. This script produces them under deploy-out/.
#
# Usage (from the repo root):
#   NEXT_PUBLIC_APP_URL=https://bookedforreal.com \
#   NEXT_PUBLIC_API_URL=https://api.bookedforreal.com \
#   DATABASE_URL=postgresql://... \
#   bash deploy/build-bundle.sh
#
# DATABASE_URL is needed at build time because the salon pages and the sitemap
# are statically generated from the database.

set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-deploy-out}"

: "${NEXT_PUBLIC_APP_URL:?Exportez NEXT_PUBLIC_APP_URL}"
: "${NEXT_PUBLIC_API_URL:?Exportez NEXT_PUBLIC_API_URL}"
: "${DATABASE_URL:?Exportez DATABASE_URL (connexion Neon)}"

export NEXT_PUBLIC_APP_URL NEXT_PUBLIC_API_URL DATABASE_URL

echo "==> Build complet (workspaces + API + web)"
export PATH="$PWD/.tools/node_modules/.bin:$PATH"
export XDG_CACHE_HOME="$PWD/.xdg-cache"
export XDG_DATA_HOME="$PWD/.xdg-data"
pnpm build

# Copie le client Prisma généré dans un bundle `pnpm deploy` (le schéma n'y est
# pas, donc `prisma generate` n'a pas pu tourner). Node résout `.prisma/client`
# comme un paquet soeur de `@prisma` dans un node_modules.
copy_prisma_client() {
  local BUNDLE="$1"
  local SRC
  SRC="$(find node_modules/.pnpm -maxdepth 5 -type d -path "*/node_modules/.prisma/client" 2>/dev/null | head -1)"
  [ -z "$SRC" ] && { echo "⚠️  `.prisma/client` introuvable — lancez `pnpm db:generate`"; return; }
  while IFS= read -r PRISMA_PKG; do
    local NM_DIR
    NM_DIR="$(dirname "$(dirname "$PRISMA_PKG")")"
    mkdir -p "$NM_DIR/.prisma"
    cp -r "$SRC" "$NM_DIR/.prisma/client"
  done < <(find "$BUNDLE/node_modules/.pnpm" -maxdepth 5 -type d -path "*/node_modules/@prisma/client" 2>/dev/null)
  echo "   → client Prisma généré copié dans $BUNDLE"
}

echo "==> Bundle API (Fastify, compilé + node_modules de prod)"
rm -rf "$OUT/api"
pnpm --filter @bookedforreal/api deploy --prod "$OUT/api"
rm -rf "$OUT/api/.env" "$OUT/api/src" "$OUT/api/coverage" "$OUT/api/.turbo" \
  "$OUT/api/tsconfig.tsbuildinfo" "$OUT/api/package.json" "$OUT/api/tsconfig.json" \
  "$OUT/api/vitest.config.ts" "$OUT/api/.eslintrc.json" 2>/dev/null || true
find "$OUT/api/dist" -name "*.test.*" -delete 2>/dev/null || true
copy_prisma_client "$OUT/api"

echo "==> Bundle web (Next.js : pnpm deploy + `next start`)"
rm -rf "$OUT/web"
pnpm --filter @bookedforreal/web deploy --prod "$OUT/web"
# `pnpm deploy` n'embarque pas le build .next : on le copie.
rm -rf "$OUT/web/.next"
cp -r apps/web/.next "$OUT/web/.next"
rm -rf "$OUT/web/.next/standalone" "$OUT/web/.next/cache" 2>/dev/null || true
# Point d'entrée unique pour Passenger : lance `next start` sur le port fourni.
cat > "$OUT/web/start.js" <<'EOF'
const { spawn } = require("node:child_process");
const path = require("node:path");
const port = process.env.PORT || 3000;
const nextBin = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
  stdio: "inherit",
  env: process.env,
  cwd: __dirname,
});
child.on("exit", (code) => process.exit(code ?? 0));
EOF
# Pas de package.json (évite `npm install`), pas de secrets ni de sources.
rm -f "$OUT/web/package.json" "$OUT/web/.env" "$OUT/web/.env.local" "$OUT/web/.eslintrc.json"
rm -rf "$OUT/web/src" "$OUT/web/coverage" "$OUT/web/.turbo" "$OUT/web/e2e" \
  "$OUT/web/tsconfig.tsbuildinfo" "$OUT/web/playwright.config.ts" "$OUT/web/vitest.config.ts" 2>/dev/null || true
copy_prisma_client "$OUT/web"

echo ""
echo "✅ Bundles prêts :"
echo "   $OUT/api   → startup file = dist/server.js"
echo "   $OUT/web   → startup file = start.js"
echo ""
echo "Envoyez-les par FTP/SSH puis suivez docs/DEPLOYMENT-O2SWITCH.md"
