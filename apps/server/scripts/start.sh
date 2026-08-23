#!/bin/sh
set -e

cd /app/apps/server

echo "🔄 Pushing database schema to PostgreSQL..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 || echo "⚠️ Schema push failed, continuing anyway..."

echo "🚀 Starting server..."
cd /app
node apps/server/dist/index.js
