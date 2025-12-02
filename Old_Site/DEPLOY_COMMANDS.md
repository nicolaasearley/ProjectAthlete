# Quick Deployment Commands

Run these commands on your **production server** (where Docker is installed):

## Step-by-Step Deployment

```bash
# 1. Navigate to production directory
cd /mnt/user/www/FitnessProgramming

# 2. Backup the database (CRITICAL!)
cp instance/workouts.db instance/workouts.db.backup.$(date +%Y%m%d_%H%M%S)
echo "Database backed up"

# 3. Stop the running container
docker stop fitness-programming
echo "Container stopped"

# 4. Rebuild the Docker image with updated code
docker build -t nic/fitness-programming:latest .
echo "Image rebuilt"

# 5. Start the container
docker start fitness-programming
echo "Container started"

# 6. Wait a few seconds for startup
sleep 5

# 7. Verify container is running
docker ps | grep fitness-programming

# 8. Check logs for any errors
docker logs --tail 30 fitness-programming
```

## Or Use Docker Compose (if using docker-compose.yml)

```bash
cd /mnt/user/www/FitnessProgramming

# Backup database
cp instance/workouts.db instance/workouts.db.backup.$(date +%Y%m%d_%H%M%S)

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## Verify Deployment

After deployment, check:
1. Visit your app URL - does it load?
2. Can you log in?
3. Are workouts still visible?
4. Do new features work?

## If Something Goes Wrong

```bash
# Stop container
docker stop fitness-programming

# Restore database backup
cp instance/workouts.db.backup.YYYYMMDD_HHMMSS instance/workouts.db

# Restart container
docker start fitness-programming
```

