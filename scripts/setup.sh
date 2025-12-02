#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Project Athlete - Initial Setup${NC}"
echo "=================================="
echo ""

# Check if .env file exists
if [ -f .env ]; then
  echo -e "${YELLOW}⚠️  .env file already exists${NC}"
  read -p "Do you want to overwrite it? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Keeping existing .env file"
    EXISTING_ENV=true
  else
    EXISTING_ENV=false
  fi
else
  EXISTING_ENV=false
fi

# Copy env.example to .env if needed
if [ "$EXISTING_ENV" = false ]; then
  echo -e "${GREEN}📝 Creating .env file from template...${NC}"
  cp env.example .env
  echo "✅ .env file created"
else
  echo -e "${GREEN}📝 Using existing .env file${NC}"
fi

echo ""

# Generate JWT secrets if not already set
if grep -q "your-jwt-access-secret-change-in-production" .env 2>/dev/null; then
  echo -e "${GREEN}🔐 Generating JWT secrets...${NC}"
  
  # Generate access secret
  ACCESS_SECRET=$(openssl rand -hex 32)
  # Generate refresh secret
  REFRESH_SECRET=$(openssl rand -hex 32)
  
  # Update .env file with generated secrets
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${ACCESS_SECRET}/" .env
    sed -i '' "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${REFRESH_SECRET}/" .env
  else
    # Linux
    sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=${ACCESS_SECRET}/" .env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${REFRESH_SECRET}/" .env
  fi
  
  echo "✅ JWT secrets generated"
else
  echo -e "${YELLOW}⚠️  JWT secrets already set in .env${NC}"
fi

echo ""

# Create necessary directories
echo -e "${GREEN}📁 Creating required directories...${NC}"
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/uploads
mkdir -p data/backups
mkdir -p logs
echo "✅ Directories created"

echo ""

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  echo "Please install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo -e "${RED}❌ Docker Compose is not installed${NC}"
  echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
  exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Summary
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review and edit .env file with your configuration"
echo "2. Run './deploy.sh' to start the application"
echo ""


