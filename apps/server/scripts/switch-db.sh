#!/usr/bin/env bash
# ── Switch database provider for the Enlace server ─────────────
# Usage:
#   ./scripts/switch-db.sh sqlite    # Switch to SQLite (local dev)
#   ./scripts/switch-db.sh postgres  # Switch to PostgreSQL (Docker)
#
# This script:
#   1. Copies the correct Prisma schema
#   2. Regenerates the Prisma client
#   3. Pushes the schema to the database

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"
PRISMA_DIR="$SERVER_DIR/prisma"

DB_TYPE="${1:-sqlite}"

case "$DB_TYPE" in
  sqlite)
    echo "🔄 Switching to SQLite..."
    cp "$PRISMA_DIR/schema.prisma" "$PRISMA_DIR/schema.prisma.bak" 2>/dev/null || true
    # The default schema.prisma is already SQLite
    echo "  ✅ Using schema.prisma (SQLite)"
    export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"
    ;;
  postgres|pg|postgresql)
    echo "🔄 Switching to PostgreSQL..."
    cp "$PRISMA_DIR/schema.prisma" "$PRISMA_DIR/schema.sqlite.prisma" 2>/dev/null || true
    cp "$PRISMA_DIR/schema.postgresql.prisma" "$PRISMA_DIR/schema.prisma"
    echo "  ✅ Using schema.postgresql.prisma (PostgreSQL)"
    export DATABASE_URL="${DATABASE_URL:-postgresql://enlace:enlace_secret@localhost:5432/enlace?schema=public}"
    ;;
  *)
    echo "❌ Unknown database type: $DB_TYPE"
    echo "   Usage: $0 [sqlite|postgres]"
    exit 1
    ;;
esac

echo ""
echo "📦 Regenerating Prisma client..."
cd "$SERVER_DIR"
DATABASE_URL="$DATABASE_URL" npx prisma generate

echo ""
echo "🚀 Pushing schema to database..."
DATABASE_URL="$DATABASE_URL" npx prisma db push --accept-data-loss 2>&1 || true

echo ""
echo "🌱 Seeding database..."
DATABASE_URL="$DATABASE_URL" npx tsx prisma/seed.ts

echo ""
echo "✅ Done! Database: $DB_TYPE ($DATABASE_URL)"
