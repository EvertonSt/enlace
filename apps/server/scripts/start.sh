#!/bin/sh
set -e

cd /app/apps/server

echo "🔄 Pushing database schema..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 || echo "⚠️ Schema push failed, continuing anyway..."

echo "🔄 Regenerating Prisma client..."
npx prisma generate 2>&1 || echo "⚠️ Prisma generate failed, continuing anyway..."

echo "📁 Generated files:"
ls -la src/generated/prisma/ 2>/dev/null || echo "No src/generated/prisma/"

echo "🔗 Copying generated client to dist..."
mkdir -p dist/generated/prisma
cp -a src/generated/prisma/. dist/generated/prisma/ 2>&1 || echo "⚠️ Copy failed"

echo "📁 dist/generated/prisma/ contents:"
ls -la dist/generated/prisma/ 2>/dev/null || echo "No dist/generated/prisma/"

echo "🚀 Starting server..."
cd /app
node apps/server/dist/index.js
