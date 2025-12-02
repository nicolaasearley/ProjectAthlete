# Architecture Documentation

## System Architecture

Fitness Earley v2 is built as a monorepo with the following structure:

### Backend (NestJS)
- **Location**: `packages/backend`
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with HTTP-only refresh tokens
- **API Versioning**: `/api/v1/*`

### Frontend (React + Vite)
- **Location**: `packages/frontend`
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with iOS 26 Liquid Glass design tokens

### Worker Service
- **Location**: `packages/worker`
- **Purpose**: Media processing (thumbnails, video transcoding)
- **Queue**: BullMQ with Redis

### Shared Package
- **Location**: `packages/shared`
- **Purpose**: Shared TypeScript types and schemas

## Data Model

See [DATA_MODEL.md](./DATA_MODEL.md) for complete data model documentation.

## Security

- Rate limiting via NestJS Throttler (Redis-backed)
- Brute-force protection on login endpoints
- JWT access tokens (15 minutes)
- HTTP-only refresh token cookies (7 days)
- Password hashing with bcrypt

## Monitoring

- **Logs**: Loki
- **Metrics**: Prometheus
- **Dashboards**: Grafana

## Backups

- Automated Postgres backups (daily at 2 AM)
- Automated uploads backups (daily at 3 AM)
- Retention: 7 days local, 30 days external

## Storage

- Primary: Local filesystem (`/data/uploads`)
- Future: S3/MinIO support via storage abstraction layer

## Deployment

See [SETUP.md](./SETUP.md) for deployment instructions.

