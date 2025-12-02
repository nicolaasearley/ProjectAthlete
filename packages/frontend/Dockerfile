# Multi-stage build for Frontend
# Build context is project root
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy root and all package.json files for workspace setup
COPY package.json package-lock.json* ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/shared/package.json packages/shared/

# Install all dependencies (npm workspaces will handle it)
RUN npm ci && npm cache clean --force

FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/shared/package.json packages/shared/

# Copy all dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source files
COPY packages/frontend/vite.config.ts packages/frontend/
COPY packages/frontend/tsconfig.json packages/frontend/tsconfig.node.json packages/frontend/
COPY packages/frontend/tailwind.config.js packages/frontend/postcss.config.js packages/frontend/
COPY packages/frontend/index.html packages/frontend/
COPY packages/frontend/src packages/frontend/src
COPY packages/shared packages/shared

# Build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
WORKDIR /app/packages/frontend
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only frontend package.json for serve dependencies
COPY packages/frontend/package.json ./packages/frontend/

# Install only production dependencies needed for serving
WORKDIR /app/packages/frontend
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=build /app/packages/frontend/dist ./dist

# Copy serve script
COPY packages/frontend/serve.js ./

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "serve.js"]
