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

# Check if backend container is running
if ! docker ps | grep -q project-athlete-backend; then
  echo -e "${YELLOW}⚠️  Backend container is not running${NC}"
  echo "Starting backend container..."
  docker-compose up -d backend
  sleep 5
fi

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
while ! docker exec project-athlete-postgres pg_isready -U postgres &> /dev/null; do
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

# Run migrations
echo -e "${BLUE}📦 Generating Prisma Client...${NC}"
docker exec project-athlete-backend sh -c "cd /app && npx prisma generate" || {
  echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
  exit 1
}

echo ""
echo -e "${BLUE}🔄 Running Prisma migrations...${NC}"
docker exec project-athlete-backend sh -c "cd /app && npx prisma migrate deploy" || {
  echo -e "${RED}❌ Migration failed${NC}"
  exit 1
}

echo ""
echo -e "${GREEN}✅ Migrations completed successfully${NC}"


