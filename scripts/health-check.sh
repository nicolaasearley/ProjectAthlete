#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

EXIT_CODE=0

echo -e "${GREEN}🏥 Health Check${NC}"
echo "=================================="
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check Docker containers
echo -e "${BLUE}🐳 Checking Docker containers...${NC}"

CONTAINERS=("project-athlete-postgres" "project-athlete-redis" "project-athlete-backend" "project-athlete-frontend" "project-athlete-worker")

for container in "${CONTAINERS[@]}"; do
  if docker ps | grep -q "$container"; then
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
    if [ "$STATUS" = "running" ]; then
      echo -e "${GREEN}✅ ${container}: running${NC}"
    else
      echo -e "${RED}❌ ${container}: ${STATUS}${NC}"
      EXIT_CODE=1
    fi
  else
    echo -e "${RED}❌ ${container}: not found${NC}"
    EXIT_CODE=1
  fi
done

echo ""

# Check PostgreSQL
echo -e "${BLUE}🗄️  Checking PostgreSQL...${NC}"
if docker exec project-athlete-postgres pg_isready -U ${POSTGRES_USER:-postgres} &> /dev/null; then
  echo -e "${GREEN}✅ PostgreSQL: healthy${NC}"
else
  echo -e "${RED}❌ PostgreSQL: not responding${NC}"
  EXIT_CODE=1
fi

# Check Redis
echo -e "${BLUE}🔴 Checking Redis...${NC}"
if docker exec project-athlete-redis redis-cli ping &> /dev/null; then
  echo -e "${GREEN}✅ Redis: healthy${NC}"
else
  echo -e "${RED}❌ Redis: not responding${NC}"
  EXIT_CODE=1
fi

echo ""

# Check Backend API
echo -e "${BLUE}🔧 Checking Backend API...${NC}"
if curl -f -s http://localhost:${API_PORT:-3000}/api/v1/health &> /dev/null; then
  echo -e "${GREEN}✅ Backend API: healthy${NC}"
else
  echo -e "${RED}❌ Backend API: not responding${NC}"
  EXIT_CODE=1
fi

# Check Frontend
echo -e "${BLUE}🌐 Checking Frontend...${NC}"
if curl -f -s http://localhost:${FRONTEND_PORT:-5173} &> /dev/null; then
  echo -e "${GREEN}✅ Frontend: healthy${NC}"
else
  echo -e "${RED}❌ Frontend: not responding${NC}"
  EXIT_CODE=1
fi

echo ""
echo "=================================="

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All health checks passed${NC}"
else
  echo -e "${RED}❌ Some health checks failed${NC}"
fi

exit $EXIT_CODE


