#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/var/www/pawactivity"

echo "=== PawActivity Deploy ==="

cd "$APP_DIR"

echo "→ Pull latest code"
git fetch origin
git reset --hard origin/main

echo "→ Install dependencies"
pnpm install --frozen-lockfile || pnpm install

echo "→ Build project (Turbo)"
pnpm build

echo "→ Generate Prisma client"
pnpm db:generate

echo "→ Run migrations"
pnpm db:migrate:deploy

echo "→ Restart PM2"
pm2 restart all

echo "→ Save PM2 state"
pm2 save

echo "→ Healthcheck"
sleep 3

curl -f http://localhost:4000/v1 || (echo "API failed" && exit 1)
curl -f http://localhost:3000 || (echo "WEB failed" && exit 1)

echo "=== Deploy OK ==="
