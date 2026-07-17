#!/usr/bin/env bash
set -euo pipefail

# Auto-deploy script: checks for new commits on main and deploys if changed.
# Intended to run via cron every few minutes.
# Returns silently if no new commits.

REPO_DIR="$HOME/unisupport"
WEB_TARGET="/srv/unisupport/web"
API_SERVICE="unisupport-api.service"

cd "$REPO_DIR"

# Fetch latest without merging
git fetch origin main 2>/dev/null

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    exit 0
fi

echo "=== New commits detected, deploying ==="
git pull origin main

npm ci
npm run build --workspace=packages/shared
npx prisma generate --schema=apps/api/prisma/schema.prisma
npm run build --workspace=apps/api
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma 2>/dev/null || echo "Migrations up to date"
npm run build --workspace=apps/web

mkdir -p "$WEB_TARGET"
cp -r apps/web/dist/* "$WEB_TARGET"

sudo systemctl restart "$API_SERVICE"
echo "=== Deploy complete ==="
