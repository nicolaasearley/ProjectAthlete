# Multi-stage build for Backend API
# Build context is project root
FROM node:20-alpine AS dependencies

WORKDIR /app/backend

# Copy package files for dependency installation
COPY packages/backend/package.json packages/backend/package-lock.json* ./
COPY package.json package-lock.json* ../root/
COPY packages/shared/package.json ../shared/

# Install dependencies
RUN cd /app/backend && npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS prisma

WORKDIR /app/backend

# Copy package files
COPY packages/backend/package.json packages/backend/package-lock.json* ./
COPY package.json package-lock.json* ../root/
COPY packages/shared/package.json ../shared/

# Install all dependencies (including dev dependencies for Prisma)
RUN cd /app/backend && npm ci && npm cache clean --force

# Copy Prisma schema
COPY packages/backend/prisma ./prisma

# Generate Prisma Client
RUN cd /app/backend && npx prisma generate

FROM node:20-alpine AS build

WORKDIR /app/backend

# Copy package files
COPY packages/backend/package.json packages/backend/package-lock.json* ./
COPY package.json package-lock.json* ../root/
COPY packages/shared/package.json ../shared/
COPY packages/shared/tsconfig.json ../shared/
COPY packages/shared/src ../shared/src

# Install all dependencies for build
RUN cd /app/backend && npm ci && npm cache clean --force

# Copy Prisma generated client from previous stage
COPY --from=prisma /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/backend/node_modules/@prisma ./node_modules/@prisma

# Copy source code
COPY packages/backend/tsconfig.json ./
COPY packages/backend/src ./src
COPY packages/backend/prisma ./prisma
COPY packages/backend/nest-cli.json ./

# Build the application
RUN cd /app/backend && npm run build

FROM node:20-alpine AS production

WORKDIR /app/backend

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY packages/backend/package.json packages/backend/package-lock.json* ./
COPY package.json package-lock.json* ../root/
COPY packages/shared/package.json ../shared/

# Install production dependencies only
RUN cd /app/backend && npm ci --only=production && npm cache clean --force

# Copy Prisma generated client and schema
COPY --from=prisma /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY packages/backend/prisma ./prisma

# Copy built application from build stage
COPY --from=build /app/backend/dist ./dist

# Copy Prisma helper script
COPY packages/backend/run-prisma-with-env.js ./

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
