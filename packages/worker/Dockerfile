# Multi-stage build for Worker Service
# Build context is project root
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy root and all package.json files for workspace setup
COPY package.json package-lock.json* ./
COPY packages/worker/package.json packages/worker/
COPY packages/shared/package.json packages/shared/

# Install all dependencies (npm workspaces will handle it)
RUN npm ci && npm cache clean --force

FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/worker/package.json packages/worker/
COPY packages/shared/package.json packages/shared/

# Copy all dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source files
COPY packages/worker/tsconfig.json packages/worker/
COPY packages/worker/src packages/worker/src
COPY packages/shared packages/shared

# Build the application
WORKDIR /app/packages/worker
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/worker/package.json packages/worker/
COPY packages/shared/package.json packages/shared/

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=build /app/packages/worker/dist ./packages/worker/dist

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/packages/worker

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pgrep -f "node dist/index.js" || exit 1

CMD ["node", "dist/index.js"]
