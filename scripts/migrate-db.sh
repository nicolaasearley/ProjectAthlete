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

# Determine network name (docker-compose creates it with project prefix)
PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
NETWORK_NAME="${PROJECT_NAME}_project-athlete-network" || "projectathlete_project-athlete-network"

# Check if network exists, if not use default
if ! docker network ls | grep -q "$NETWORK_NAME"; then
  NETWORK_NAME="projectathlete_project-athlete-network"
fi

# Run migrations using a one-off container (doesn't start the app)
echo -e "${BLUE}📦 Generating Prisma Client...${NC}"
docker run --rm \
  --network "$NETWORK_NAME" \
  -e DATABASE_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-fitness_earley}?schema=public" \
  projectathlete-backend \
  sh -c "cd /app/packages/backend && npx prisma generate" || {
  echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
  exit 1
}

echo ""
echo -e "${BLUE}🔄 Running Prisma migrations...${NC}"
docker run --rm \
  --network "$NETWORK_NAME" \
  -e DATABASE_URL="postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-fitness_earley}?schema=public" \
  projectathlete-backend \
  sh -c "cd /app/packages/backend && npx prisma migrate deploy" || {
  echo -e "${RED}❌ Migration failed${NC}"
  exit 1
}

echo ""
echo -e "${GREEN}✅ Migrations completed successfully${NC}"


