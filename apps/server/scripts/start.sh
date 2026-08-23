#!/bin/sh
set -e

echo "🔄 Pushing database schema..."
cd /app/apps/server

# Push schema to PostgreSQL
npx prisma db push --accept-data-loss --skip-generate 2>&1 || echo "⚠️ Schema push failed, continuing anyway..."

echo "🔄 Regenerating Prisma client for runtime..."
npx prisma generate 2>&1 || echo "⚠️ Prisma generate failed, continuing anyway..."

echo "🚀 Starting server..."
cd /app
node apps/server/dist/index.js
