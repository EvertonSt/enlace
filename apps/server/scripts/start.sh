#!/bin/sh
set -e

cd /app/apps/server

echo "🔄 Pushing database schema to PostgreSQL..."
npx prisma db push --accept-data-loss 2>&1 || echo "⚠️ Schema push failed, continuing anyway..."

echo "🌱 Seeding database if empty..."
npx tsx prisma/seed.ts 2>&1 || echo "⚠️ Seed failed or already seeded, continuing..."

echo "🚀 Starting server..."
cd /app
node apps/server/dist/index.js
