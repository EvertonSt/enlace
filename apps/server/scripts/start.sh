#!/bin/sh
set -e

echo "🔄 Pushing database schema..."
cd /app/apps/server
DATABASE_URL="$DATABASE_URL" npx prisma db push --schema prisma/schema.prisma --accept-data-loss --skip-generate 2>&1 || echo "⚠️ Schema push failed, continuing anyway..."

echo "🚀 Starting server..."
cd /app
node apps/server/dist/index.js
