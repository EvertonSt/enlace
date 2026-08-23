# ── Multi-stage Dockerfile for PostgreSQL ───────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

# ── Stage 1: Install all dependencies ──────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/core/package.json ./packages/core/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

# ── Stage 2: Generate Prisma + Build TypeScript ────────────────────
FROM deps AS build

# Copy PostgreSQL schema for production build
COPY apps/server/prisma/schema.postgresql.prisma ./apps/server/prisma/schema.prisma
COPY apps/server/prisma.config.ts ./apps/server/prisma.config.ts

# Generate Prisma client (PostgreSQL)
RUN cd apps/server && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Copy source files
COPY apps/server/tsconfig.json ./apps/server/
COPY apps/server/src/ ./apps/server/src/
COPY packages/core/src/ ./packages/core/src/
COPY packages/core/package.json ./packages/core/
COPY packages/core/tsconfig.json ./packages/core/
COPY packages/config/ ./packages/config/

# Build TypeScript (core first, then server)
RUN cd packages/core && pnpm build
RUN cd apps/server && pnpm build

# Copy Prisma generated client into dist/ so compiled code can find it
RUN cp -r apps/server/src/generated apps/server/dist/generated

# ── Stage 3: Production image ──────────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

# Install production dependencies only
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/core/package.json ./packages/core/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --prod --filter @enlace/server...

# Copy built artifacts from build stage
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/packages/core/dist ./packages/core/dist

# Copy Prisma schema, config, seed, and generated client for runtime
COPY apps/server/prisma/schema.postgresql.prisma ./apps/server/prisma/schema.prisma
COPY apps/server/prisma.config.ts ./apps/server/prisma.config.ts
COPY apps/server/prisma/seed.ts ./apps/server/prisma/seed.ts
COPY --from=build /app/apps/server/src/generated ./apps/server/src/generated
COPY apps/server/scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["./start.sh"]
