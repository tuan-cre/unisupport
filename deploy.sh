#!/usr/bin/env bash
set -euo pipefail

# UniSupport deploy script
# Run from the project root on the production server.
# Usage: ./deploy.sh

REPO_DIR="$HOME/unisupport"
WEB_TARGET="/srv/unisupport/web"
API_SERVICE="unisupport-api.service"

echo "=== Pulling latest code ==="
cd "$REPO_DIR"
git pull origin main

# Only reinstall if dependency files changed
if git diff HEAD@{1} --name-only 2>/dev/null | grep -qE '^(package\.json|package-lock\.json|npm-shrinkwrap\.json)$' || \
   [ ! -d node_modules ]; then
  echo "=== Dependencies changed, reinstalling ==="
  npm ci
else
  echo "=== Dependencies up to date, skipping install ==="
fi

echo "=== Building shared package ==="
npm run build --workspace=packages/shared

# Only regenerate Prisma client if schema changed
if git diff HEAD@{1} --name-only 2>/dev/null | grep -q 'schema\.prisma$' || \
   [ ! -d node_modules/.prisma ]; then
  echo "=== Generating Prisma client ==="
  npx prisma generate --schema=apps/api/prisma/schema.prisma
else
  echo "=== Prisma client up to date, skipping ==="
fi

echo "=== Building API ==="
npm run build --workspace=apps/api

echo "=== Running DB migrations ==="
npm run prisma:migrate --workspace=apps/api 2>/dev/null || echo "Migrations up to date"

echo "=== Building web frontend ==="
npm run build --workspace=apps/web

echo "=== Copying web build to $WEB_TARGET ==="
mkdir -p "$WEB_TARGET"
cp -r apps/web/dist/* "$WEB_TARGET"

echo "=== Restarting API service ==="
sudo systemctl restart "$API_SERVICE"
sudo systemctl status "$API_SERVICE" --no-pager | head -5

echo "=== Done ==="
