#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌱 Seeding Database${NC}"
echo "=================================="
echo ""

# Check if postgres container is running
if ! docker ps | grep -q project-athlete-postgres; then
  echo -e "${RED}❌ PostgreSQL container is not running${NC}"
  echo "Please start the database first: docker-compose up -d postgres"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
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

# Run seed using docker-compose run with build dependencies
# We need to use a container that has dev dependencies (ts-node)
echo -e "${BLUE}🌱 Seeding database with initial data...${NC}"

# Use docker run with the backend image but install ts-node temporarily
$DOCKER_COMPOSE_CMD run --rm --no-deps backend sh -c "
  cd /app/packages/backend && \
  npm install --no-save ts-node typescript && \
  npx ts-node --transpile-only prisma/seed.ts
" || {
  echo -e "${RED}❌ Seeding failed${NC}"
  exit 1
}

echo ""
echo -e "${GREEN}✅ Database seeded successfully${NC}"
echo ""
echo -e "${BLUE}Test users created:${NC}"
echo "  Admin: admin@fitnessearley.com / admin123"
echo "  Coach: coach@fitnessearley.com / coach123"
echo ""

