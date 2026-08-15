# syntax=docker/dockerfile:1
# Build context is the REPO ROOT (see render.yaml dockerContext: .) so npm
# workspaces resolve correctly.

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# OpenSSL is required by Prisma's engines on debian-slim.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy manifests first for better layer caching, then install the whole
# workspace (dev deps included — needed to compile the API).
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages ./packages
RUN npm install --no-audit --no-fund

# Build the API: generate the Prisma client, then compile with Nest.
COPY apps/api ./apps/api
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=api

# Strip dev dependencies from node_modules for the runtime image. The Prisma
# CLI and @prisma/client are runtime deps, so they survive the prune.
RUN npm prune --omit=dev

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
# Operational scripts are run by hand on the Render shell, so they have to
# be in the runtime image — dist and prisma alone left `scripts/` on the
# build host, and the first attempt to use one failed with MODULE_NOT_FOUND.
COPY --from=builder /app/apps/api/scripts ./apps/api/scripts

EXPOSE 4000

# Apply any pending migrations, then start the server. Nest compiles
# src/main.ts to dist/src/main.js (rootDir is the package root).
CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/src/main.js"]
