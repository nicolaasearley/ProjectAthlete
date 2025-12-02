# Setup Guide

Complete setup instructions for Fitness Earley v2 development environment.

## Prerequisites

- Node.js >= 18.0.0
- Docker and Docker Compose
- Git

## Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd ProjectAthlete
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start PostgreSQL with Docker Compose**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Generate Prisma Client**
   ```bash
   cd packages/backend
   npm run prisma:generate
   ```

6. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

7. **Seed the database (optional)**
   ```bash
   npm run prisma:seed
   ```

8. **Start all services**
   ```bash
   docker-compose up -d
   ```

   Or start individually:
   ```bash
   # Backend
   npm run dev:backend

   # Frontend (in another terminal)
   npm run dev:frontend
   ```

## Access Points

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1
- Traefik Dashboard: http://localhost:8080
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

## Troubleshooting

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture information.

