# Multi-stage build for Frontend
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

# Install dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /../../node_modules ../../node_modules

# Copy source code and config
COPY vite.config.ts ./
COPY tsconfig.json tsconfig.node.json ./
COPY tailwind.config.js postcss.config.js ./
COPY index.html ./
COPY src ./src
COPY public ./public

# Build argument for API URL (can be overridden at build time)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files for serve dependencies
COPY package.json ./

# Install only production dependencies needed for serving
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy serve script
COPY serve.js ./

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5173', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "serve.js"]


