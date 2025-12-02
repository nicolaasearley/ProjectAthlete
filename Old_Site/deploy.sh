#!/bin/bash
set -e  # Exit on any error

# Configuration - Update these paths for your production server
PROD_DIR="/mnt/user/www/FitnessProgramming"
CONTAINER_NAME="fitness-programming"

echo "=== Fitness Programming Deployment Script ==="
echo ""

# Step 1: Backup database
echo "1. Creating database backup..."
if [ -f "${PROD_DIR}/instance/workouts.db" ]; then
    BACKUP_FILE="${PROD_DIR}/instance/workouts.db.backup.$(date +%Y%m%d_%H%M%S)"
    cp "${PROD_DIR}/instance/workouts.db" "${BACKUP_FILE}"
    echo "   ✓ Backup created: ${BACKUP_FILE}"
else
    echo "   ⚠ Warning: Database file not found at ${PROD_DIR}/instance/workouts.db"
fi
echo ""

# Step 2: Stop container
echo "2. Stopping container..."
if docker ps | grep -q "${CONTAINER_NAME}"; then
    docker stop ${CONTAINER_NAME}
    echo "   ✓ Container stopped"
else
    echo "   ℹ Container was not running"
fi
echo ""

# Step 3: Rebuild Docker image
echo "3. Rebuilding Docker image..."
cd "${PROD_DIR}"
docker build -t nic/fitness-programming:latest .
echo "   ✓ Image rebuilt"
echo ""

# Step 4: Start container
echo "4. Starting container..."
if docker ps -a | grep -q "${CONTAINER_NAME}"; then
    docker start ${CONTAINER_NAME}
else
    echo "   ℹ Container doesn't exist, starting with docker-compose..."
    docker-compose up -d
fi
echo "   ✓ Container started"
echo ""

# Step 5: Wait for container to start
echo "5. Waiting for container to initialize..."
sleep 5
echo ""

# Step 6: Verify deployment
echo "6. Verifying deployment..."
if docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "   ✓ Container is running"
    echo ""
    echo "   Container status:"
    docker ps | grep ${CONTAINER_NAME}
    echo ""
    echo "   Recent logs:"
    docker logs --tail 20 ${CONTAINER_NAME}
else
    echo "   ✗ ERROR: Container is not running!"
    echo "   Check logs with: docker logs ${CONTAINER_NAME}"
    exit 1
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "  1. Visit your application URL to verify it's working"
echo "  2. Test logging in"
echo "  3. Verify workouts are still visible"
echo ""
echo "If something went wrong, restore from backup:"
if [ -n "${BACKUP_FILE}" ]; then
    echo "  cp ${BACKUP_FILE} ${PROD_DIR}/instance/workouts.db"
fi

