# Fitness Earley v2

Complete rebuild of the Fitness Earley web application with modern architecture, Docker-based deployment, and comprehensive feature set.

## Project Structure

This is a monorepo containing:

- `packages/backend` - NestJS API server
- `packages/frontend` - React + Vite frontend
- `packages/worker` - Media processing worker service
- `packages/shared` - Shared TypeScript types and schemas

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- Git
- PostgreSQL 15 (or use Docker)

### Development Setup

For local development:

### Manual Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Generate JWT secrets: openssl rand -hex 32 (run twice)
   # Edit .env and add your JWT secrets
   ```

3. **Start Docker services**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Set up database**
   ```bash
   cd packages/backend
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed  # Optional - creates test users
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend

   # Terminal 2 - Frontend
   npm run dev:frontend
   ```

## Deployment

For production deployment, see the comprehensive [Deployment Guide](docs/DEPLOYMENT.md).

**Quick deployment:**
```bash
git clone https://github.com/nicolaasearley/ProjectAthlete.git
cd ProjectAthlete
./scripts/setup.sh
./deploy.sh
```

## Repository

- **GitHub:** https://github.com/nicolaasearley/ProjectAthlete.git

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Complete production deployment guide
- [Setup Guide](docs/SETUP.md) - Detailed development setup instructions
- [Architecture](docs/ARCHITECTURE.md) - Architecture decisions
- [API Documentation](docs/API.md) - API endpoint reference
- [Data Model](docs/DATA_MODEL.md) - Database schema documentation
- [Migration Guide](docs/MIGRATION.md) - Migrating from Old_Site

## Tech Stack

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 15
- **Reverse Proxy**: Traefik
- **Monitoring**: Loki + Prometheus + Grafana
- **Storage**: Local filesystem with S3/MinIO abstraction

## License

Private project - All rights reserved

