#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Running Database Migrations${NC}"
echo "=================================="
echo ""

# Check if postgres container is running
if ! docker ps | grep -q project-athlete-postgres; then
  echo -e "${RED}❌ PostgreSQL container is not running${NC}"
  echo "Please start the database first: docker-compose up -d postgres"
  exit 1
fi

# Wait for database to be ready
echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
timeout=60
counter=0
while ! docker exec project-athlete-postgres pg_isready -U ${POSTGRES_USER:-postgres} &> /dev/null; do
  sleep 1
  counter=$((counter + 1))
  if [ $counter -ge $timeout ]; then
    echo -e "${RED}❌ Database failed to become ready${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✅ Database is ready${NC}"

echo ""

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if backend image exists
if ! docker images | grep -q projectathlete-backend; then
  echo -e "${RED}❌ Backend Docker image not found${NC}"
  echo "Please build images first: docker-compose build"
  exit 1
fi

# Check for docker-compose command
DOCKER_COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
  if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
  else
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
  fi
fi

# Run migrations using docker-compose run (automatically uses correct network and env)
echo -e "${BLUE}📦 Generating Prisma Client...${NC}"
$DOCKER_COMPOSE_CMD run --rm --no-deps backend sh -c "cd /app/packages/backend && npx prisma generate" || {
  echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
  exit 1
}

echo ""
echo -e "${BLUE}🔄 Setting up database schema...${NC}"

# Check if migrations directory has any migration files
if [ -d "packages/backend/prisma/migrations" ] && [ "$(ls -A packages/backend/prisma/migrations 2>/dev/null)" ]; then
  echo -e "${BLUE}   Found migration files, running migrate deploy...${NC}"
  $DOCKER_COMPOSE_CMD run --rm --no-deps backend sh -c "cd /app/packages/backend && npx prisma migrate deploy" || {
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
  }
else
  echo -e "${YELLOW}⚠️  No migration files found. Creating schema from Prisma schema...${NC}"
  echo -e "${BLUE}   Using 'prisma db push' to create schema...${NC}"
  $DOCKER_COMPOSE_CMD run --rm --no-deps backend sh -c "cd /app/packages/backend && npx prisma db push --accept-data-loss" || {
    echo -e "${RED}❌ Failed to push schema${NC}"
    exit 1
  }
  echo -e "${GREEN}✅ Schema created successfully${NC}"
fi

echo ""
echo -e "${GREEN}✅ Migrations completed successfully${NC}"


