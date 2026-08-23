# ── Multi-stage Dockerfile for PostgreSQL (Docker Compose) ──────────
# Builds the Enlace API server against PostgreSQL.
# Used by: docker-compose.yml

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

# ── Stage 1: Install dependencies ──────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/core/package.json ./packages/core/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

# ── Stage 2: Generate Prisma client for PostgreSQL ─────────────────
FROM deps AS prisma
COPY apps/server/prisma/schema.postgresql.prisma ./apps/server/prisma/schema.prisma
COPY apps/server/prisma.config.ts ./apps/server/prisma.config.ts
RUN cd apps/server && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# ── Stage 3: Build TypeScript ──────────────────────────────────────
FROM prisma AS build
COPY apps/server/tsconfig.json ./apps/server/
COPY apps/server/src/ ./apps/server/src/
COPY packages/core/src/ ./packages/core/src/
COPY packages/core/package.json ./packages/core/
COPY packages/core/tsconfig.json ./packages/core/
COPY packages/config/ ./packages/config/
RUN cd packages/core && pnpm build
RUN cd apps/server && pnpm build

# ── Stage 4: Production image ──────────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

# Install production dependencies only
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/core/package.json ./packages/core/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --prod --filter @enlace/server...

# Copy built files
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=prisma /app/apps/server/src/generated ./apps/server/src/generated
COPY --from=prisma /app/apps/server/src/generated ./apps/server/dist/generated
COPY apps/server/prisma/schema.prisma ./apps/server/prisma/
COPY apps/server/prisma.config.ts ./apps/server/prisma.config.ts
COPY apps/server/scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["./start.sh"]
