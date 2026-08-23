# ── Stage 1: Install dependencies ──────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/core/package.json ./packages/core/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --filter @enlace/server...

# ── Stage 2: Build ────────────────────────────────────────────────
FROM deps AS build

# Copy source
COPY apps/server/ ./apps/server/
COPY packages/core/ ./packages/core/
COPY packages/config/ ./packages/config/

# Switch to PostgreSQL schema for production
RUN cp apps/server/prisma/schema.postgresql.prisma apps/server/prisma/schema.prisma

# Generate Prisma client for PostgreSQL
RUN cd apps/server && npx prisma generate

# Build TypeScript
RUN cd apps/server && pnpm build

# ── Stage 3: Production ──────────────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate
WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/prisma ./prisma
COPY --from=build /app/apps/server/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/apps/server/package.json ./
COPY --from=build /app/packages/core/package.json ./packages/core/
COPY --from=build /app/packages/core/dist ./packages/core/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --filter @enlace/server...

EXPOSE 3001
CMD ["node", "dist/index.js"]
