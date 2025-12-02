#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}💾 Database Backup${NC}"
echo "=================================="
echo ""

# Check if postgres container is running
if ! docker ps | grep -q project-athlete-postgres; then
  echo -e "${RED}❌ PostgreSQL container is not running${NC}"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Create backups directory
mkdir -p data/backups

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="data/backups/backup_${TIMESTAMP}.sql"
BACKUP_DIR="data/backups"

echo -e "${BLUE}📦 Creating backup...${NC}"

# Create backup
docker exec project-athlete-postgres pg_dump -U ${POSTGRES_USER:-postgres} ${POSTGRES_DB:-fitness_earley} > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  # Compress backup
  echo -e "${BLUE}📦 Compressing backup...${NC}"
  gzip "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gz"
  
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo -e "${GREEN}✅ Backup created successfully${NC}"
  echo -e "   File: ${GREEN}${BACKUP_FILE}${NC}"
  echo -e "   Size: ${GREEN}${BACKUP_SIZE}${NC}"
  
  # Clean old backups (keep last 7 by default)
  RETENTION_DAYS=${BACKUP_RETENTION_DAYS_LOCAL:-7}
  echo -e "${BLUE}🧹 Cleaning backups older than ${RETENTION_DAYS} days...${NC}"
  find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
  echo -e "${GREEN}✅ Cleanup complete${NC}"
else
  echo -e "${RED}❌ Backup failed${NC}"
  exit 1
fi

echo ""


