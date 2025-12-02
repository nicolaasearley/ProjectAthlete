#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
BUILD=false
MIGRATE=false
SEED=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --build)
      BUILD=true
      shift
      ;;
    --migrate)
      MIGRATE=true
      shift
      ;;
    --seed)
      SEED=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: ./deploy.sh [--build] [--migrate] [--seed]"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🚀 Project Athlete - Deployment${NC}"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  .env file not found${NC}"
  echo "Running setup script first..."
  ./scripts/setup.sh
  echo ""
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  exit 1
fi

# Check Docker Compose (support both docker-compose and docker compose)
DOCKER_COMPOSE_CMD="docker-compose"
if ! command -v docker-compose &> /dev/null; then
  if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
  else
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Ensure required directories exist
echo -e "${BLUE}📁 Creating required directories...${NC}"
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/uploads
mkdir -p data/backups
mkdir -p logs
echo -e "${GREEN}✅ Directories ready${NC}"

echo ""

# Build images if requested or if they don't exist
if [ "$BUILD" = true ] || [ -z "$(docker images -q project-athlete-backend 2>/dev/null)" ]; then
  echo -e "${BLUE}🔨 Building Docker images...${NC}"
  $DOCKER_COMPOSE_CMD build
  echo -e "${GREEN}✅ Images built${NC}"
  echo ""
fi

# Start infrastructure services first (postgres, redis)
echo -e "${BLUE}🗄️  Starting database and cache services...${NC}"
$DOCKER_COMPOSE_CMD up -d postgres redis

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for database to be ready...${NC}"
timeout=60
counter=0
while ! docker exec project-athlete-postgres pg_isready -U ${POSTGRES_USER:-postgres} &> /dev/null; do
  sleep 1
  counter=$((counter + 1))
  if [ $counter -ge $timeout ]; then
    echo -e "${RED}❌ Database failed to start within ${timeout} seconds${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✅ Database is ready${NC}"

echo ""

# Run migrations before starting backend (use one-off container)
if [ "$MIGRATE" = true ] || [ -z "$(docker ps -aq -f name=project-athlete-backend)" ]; then
  echo -e "${BLUE}🔄 Running database migrations...${NC}"
  ./scripts/migrate-db.sh || {
    echo -e "${RED}❌ Migration failed${NC}"
    echo "Check the error messages above"
    exit 1
  }
  echo ""
fi

# Start all services (backend will start now that migrations are done)
echo -e "${BLUE}🚀 Starting all services...${NC}"
if ! $DOCKER_COMPOSE_CMD up -d; then
  echo -e "${RED}❌ Failed to start services${NC}"
  echo ""
  echo -e "${BLUE}Backend container logs:${NC}"
  docker logs project-athlete-backend --tail 50 2>&1 || echo "Container not found or no logs available"
  exit 1
fi

echo ""

# Wait a moment for services to start
sleep 10

# Health checks
echo -e "${BLUE}🏥 Checking service health...${NC}"

# Check backend
BACKEND_STATUS=$(docker inspect --format='{{.State.Status}}' project-athlete-backend 2>/dev/null || echo "not found")
if [ "$BACKEND_STATUS" != "running" ]; then
  echo -e "${RED}❌ Backend container is not running (status: $BACKEND_STATUS)${NC}"
  echo ""
  echo -e "${BLUE}📋 Backend container logs (last 100 lines):${NC}"
  echo "----------------------------------------"
  docker logs project-athlete-backend --tail 100 2>&1 || echo "Could not retrieve logs"
  echo ""
  echo -e "${YELLOW}💡 Common issues:${NC}"
  echo "  1. Missing JWT secrets (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)"
  echo "  2. Database connection error (check DATABASE_URL)"
  echo "  3. Port already in use"
  echo "  4. Missing environment variables"
  echo ""
  echo -e "${BLUE}To check environment variables:${NC}"
  echo "  docker exec project-athlete-backend env | grep -E 'JWT|DATABASE'"
  exit 1
fi

if curl -f http://localhost:${API_PORT:-3000}/api/v1/health &> /dev/null; then
  echo -e "${GREEN}✅ Backend is healthy${NC}"
else
  echo -e "${YELLOW}⚠️  Backend health check failed (may still be starting)${NC}"
  echo ""
  echo -e "${BLUE}📋 Backend container logs (last 50 lines):${NC}"
  echo "----------------------------------------"
  docker logs project-athlete-backend --tail 50 2>&1
  echo ""
fi

# Check frontend
if curl -f http://localhost:${FRONTEND_PORT:-5173} &> /dev/null; then
  echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
  echo -e "${YELLOW}⚠️  Frontend health check failed (may still be starting)${NC}"
fi

echo ""

# Display service status
echo -e "${BLUE}📊 Service Status:${NC}"
$DOCKER_COMPOSE_CMD ps

echo ""
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}🌐 Access Points:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:${FRONTEND_PORT:-5173}${NC}"
echo -e "   Backend API: ${GREEN}http://localhost:${API_PORT:-3000}/api/v1${NC}"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f [service-name]"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo ""


