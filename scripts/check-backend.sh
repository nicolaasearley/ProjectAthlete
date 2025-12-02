#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Backend Diagnostic Check${NC}"
echo "=================================="
echo ""

# Check if container exists
if ! docker ps -a | grep -q project-athlete-backend; then
  echo -e "${RED}❌ Backend container does not exist${NC}"
  exit 1
fi

# Check container status
echo -e "${BLUE}📊 Container Status:${NC}"
docker ps -a | grep project-athlete-backend
echo ""

# Check if container is running
if docker ps | grep -q project-athlete-backend; then
  echo -e "${GREEN}✅ Container is running${NC}"
else
  echo -e "${RED}❌ Container is not running${NC}"
  echo ""
  echo -e "${BLUE}Container state:${NC}"
  docker inspect --format='{{.State.Status}}' project-athlete-backend 2>/dev/null || echo "not found"
  echo ""
fi

# Show recent logs
echo -e "${BLUE}📋 Recent Backend Logs (last 50 lines):${NC}"
echo "----------------------------------------"
docker logs project-athlete-backend --tail 50 2>&1 || echo "Could not retrieve logs"
echo ""

# Check health endpoint if container is running
if docker ps | grep -q project-athlete-backend; then
  echo -e "${BLUE}🏥 Health Check:${NC}"
  if curl -f -s http://localhost:${API_PORT:-3000}/api/v1/health &> /dev/null; then
    echo -e "${GREEN}✅ Health endpoint is responding${NC}"
    curl -s http://localhost:${API_PORT:-3000}/api/v1/health | head -5
  else
    echo -e "${RED}❌ Health endpoint is not responding${NC}"
    echo "This could mean:"
    echo "  - Backend is still starting up"
    echo "  - Backend crashed after starting"
    echo "  - Port is not accessible"
  fi
  echo ""
fi

# Check environment variables
echo -e "${BLUE}🔐 Environment Variables Check:${NC}"
if [ -f .env ]; then
  if grep -q "JWT_ACCESS_SECRET=" .env && ! grep -q "your-jwt-access-secret-change-in-production" .env; then
    echo -e "${GREEN}✅ JWT_ACCESS_SECRET is set${NC}"
  else
    echo -e "${YELLOW}⚠️  JWT_ACCESS_SECRET may not be set properly${NC}"
  fi
  
  if grep -q "JWT_REFRESH_SECRET=" .env && ! grep -q "your-jwt-refresh-secret-change-in-production" .env; then
    echo -e "${GREEN}✅ JWT_REFRESH_SECRET is set${NC}"
  else
    echo -e "${YELLOW}⚠️  JWT_REFRESH_SECRET may not be set properly${NC}"
  fi
  
  if grep -q "DATABASE_URL=" .env; then
    echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
  else
    echo -e "${YELLOW}⚠️  DATABASE_URL may not be set${NC}"
  fi
else
  echo -e "${RED}❌ .env file not found${NC}"
fi
echo ""

# Check database connectivity
echo -e "${BLUE}🗄️  Database Connectivity:${NC}"
if docker ps | grep -q project-athlete-postgres; then
  if docker exec project-athlete-postgres pg_isready -U ${POSTGRES_USER:-postgres} &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
  else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  PostgreSQL container is not running${NC}"
fi
echo ""

echo -e "${BLUE}💡 Next Steps:${NC}"
echo "1. If container is not running, check the logs above for errors"
echo "2. Verify all required environment variables are set in .env"
echo "3. Check database connectivity"
echo "4. Try restarting: docker-compose restart backend"
echo "5. If issues persist, rebuild: docker-compose build --no-cache backend && docker-compose up -d backend"
echo ""

