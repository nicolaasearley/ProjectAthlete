# Multi-stage build for Backend API
# Build context is project root
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy root and all package.json files for workspace setup
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/
COPY packages/shared/package.json packages/shared/

# Install all dependencies (npm workspaces will handle it)
RUN npm ci && npm cache clean --force

FROM node:20-alpine AS prisma

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/
COPY packages/shared/package.json packages/shared/

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy Prisma schema
COPY packages/backend/prisma ./packages/backend/prisma

# Generate Prisma Client
WORKDIR /app/packages/backend
RUN npx prisma generate

FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/
COPY packages/shared/package.json packages/shared/

# Copy all dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy Prisma generated client (generated to root node_modules due to workspaces)
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma

# Copy source files
COPY tsconfig.json ./
COPY packages/backend/tsconfig.json packages/backend/
COPY packages/backend/nest-cli.json packages/backend/
COPY packages/backend/src packages/backend/src
COPY packages/backend/prisma packages/backend/prisma
COPY packages/shared packages/shared

# Build the application
WORKDIR /app/packages/backend
RUN echo "=== Starting build ===" && \
    npm run build 2>&1 | head -100 && \
    echo "=== Build complete, checking dist directory ===" && \
    ls -la dist/ && \
    echo "=== Checking for main.js ===" && \
    find dist -name "main.js" -o -name "*.js" | head -20 && \
    echo "=== Verifying main.js exists ===" && \
    test -f dist/main.js || (echo "ERROR: dist/main.js not found after build! Contents of dist:" && ls -laR dist/ && exit 1)

FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/
COPY packages/shared/package.json packages/shared/

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma generated client and schema (generated to root node_modules due to workspaces)
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY packages/backend/prisma ./packages/backend/prisma

# Copy built application
COPY --from=build /app/packages/backend/dist ./packages/backend/dist

# Copy Prisma helper script
COPY packages/backend/run-prisma-with-env.js ./packages/backend/

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

WORKDIR /app/packages/backend

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
