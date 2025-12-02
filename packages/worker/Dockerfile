# Multi-stage build for Worker Service
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
COPY ../../package.json ../../package-lock.json* ../../
COPY ../shared/package.json ../shared/

# Install dependencies
RUN npm ci && npm cache clean --force

FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY ../../package.json ../../package-lock.json* ../../
COPY ../shared/package.json ../shared/
COPY ../shared/tsconfig.json ../shared/
COPY ../shared/src ../shared/src

# Install dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /../../node_modules ../../node_modules

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json package-lock.json* ./
COPY ../../package.json ../../package-lock.json* ../../
COPY ../shared/package.json ../shared/

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Health check (worker doesn't have HTTP endpoint, so just check process)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD pgrep -f "node dist/index.js" || exit 1

CMD ["node", "dist/index.js"]


