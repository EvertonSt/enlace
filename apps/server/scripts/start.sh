#!/bin/sh
set -e

cd /app/apps/server

echo "🔄 Pushing database schema..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 || echo "⚠️ Schema push failed, continuing anyway..."

echo "🔄 Regenerating Prisma client..."
npx prisma generate 2>&1 || echo "⚠️ Prisma generate failed, continuing anyway..."

echo "🔗 Linking generated client for compiled code..."
mkdir -p dist/generated
cp -r src/generated/prisma/* dist/generated/prisma/ 2>/dev/null || true

echo "🚀 Starting server..."
cd /app
node apps/server/dist/index.js
