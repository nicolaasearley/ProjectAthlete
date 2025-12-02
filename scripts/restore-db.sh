#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}♻️  Database Restore${NC}"
echo "=================================="
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ No backup file specified${NC}"
  echo "Usage: ./scripts/restore-db.sh <backup-file>"
  echo ""
  echo "Available backups:"
  ls -lh data/backups/*.sql.gz 2>/dev/null || echo "  No backups found"
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Backup file not found: ${BACKUP_FILE}${NC}"
  exit 1
fi

# Check if postgres container is running
if ! docker ps | grep -q project-athlete-postgres; then
  echo -e "${RED}❌ PostgreSQL container is not running${NC}"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Confirm restore
echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
echo -e "   Backup file: ${BACKUP_FILE}"
read -p "Are you sure you want to continue? (yes/NO): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "Restore cancelled"
  exit 0
fi

echo ""

# Stop services that use the database
echo -e "${BLUE}🛑 Stopping services...${NC}"
docker-compose stop backend worker || true

echo ""

# Create backup before restore
echo -e "${BLUE}💾 Creating safety backup before restore...${NC}"
./scripts/backup-db.sh || echo -e "${YELLOW}⚠️  Failed to create safety backup, continuing anyway...${NC}"

echo ""

# Restore database
echo -e "${BLUE}📦 Restoring database...${NC}"

# Check if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  # Restore from compressed backup
  gunzip -c "$BACKUP_FILE" | docker exec -i project-athlete-postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-fitness_earley}
else
  # Restore from uncompressed backup
  cat "$BACKUP_FILE" | docker exec -i project-athlete-postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-fitness_earley}
fi

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database restored successfully${NC}"
else
  echo -e "${RED}❌ Restore failed${NC}"
  exit 1
fi

echo ""

# Restart services
echo -e "${BLUE}🚀 Restarting services...${NC}"
docker-compose up -d backend worker

echo ""
echo -e "${GREEN}✨ Restore complete!${NC}"


