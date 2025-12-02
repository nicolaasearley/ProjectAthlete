#!/bin/bash
# Quick Deployment Script for Production Server
# Run this on your production server: /mnt/user/www/FitnessProgramming

set -e

PROD_DIR="/mnt/user/www/FitnessProgramming"
CONTAINER_NAME="fitness-programming"

echo "🚀 Starting deployment..."

# Backup database
echo "📦 Backing up database..."
BACKUP_FILE="${PROD_DIR}/instance/workouts.db.backup.$(date +%Y%m%d_%H%M%S)"
cp "${PROD_DIR}/instance/workouts.db" "${BACKUP_FILE}"
echo "✓ Backup: ${BACKUP_FILE}"

# Stop container
echo "🛑 Stopping container..."
docker stop ${CONTAINER_NAME} 2>/dev/null || echo "Container not running"

# Rebuild
echo "🔨 Rebuilding image..."
cd "${PROD_DIR}"
docker build -t nic/fitness-programming:latest .

# Start
echo "▶️  Starting container..."
docker start ${CONTAINER_NAME} || docker-compose up -d

# Wait
sleep 3

# Verify
echo "✅ Verifying..."
if docker ps | grep -q ${CONTAINER_NAME}; then
    echo "✓ Container is running!"
    docker ps | grep ${CONTAINER_NAME}
else
    echo "✗ Container failed to start!"
    docker logs --tail 50 ${CONTAINER_NAME}
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
echo "Check logs: docker logs -f ${CONTAINER_NAME}"

