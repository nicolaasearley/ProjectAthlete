#!/bin/bash
# Fix deployment issues - refresh changes that aren't showing

echo "🔧 Fixing deployment issues..."

# 1. Stop container
echo "1. Stopping container..."
docker stop fitness-programming

# 2. Clear Python cache
echo "2. Clearing Python cache..."
find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

# 3. Rebuild without cache (forces fresh build)
echo "3. Rebuilding image without cache..."
docker build --no-cache -t nic/fitness-programming:latest .

# 4. Remove old container (if exists)
echo "4. Removing old container..."
docker rm fitness-programming 2>/dev/null || true

# 5. Start fresh container
echo "5. Starting fresh container..."
docker-compose up -d

# 6. Wait for startup
echo "6. Waiting for container to start..."
sleep 5

# 7. Check status
echo "7. Container status:"
docker ps | grep fitness-programming

echo ""
echo "✅ Done! Try these steps:"
echo "  1. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)"
echo "  2. Clear browser cache for the site"
echo "  3. Check logs: docker logs -f fitness-programming"

