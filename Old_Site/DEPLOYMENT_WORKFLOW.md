# Deployment Workflow Guide

This guide explains how to safely update your live production deployment without losing data.

## Critical File to Preserve

**`instance/workouts.db`** (or `workouts.db` if not using Docker)

This SQLite database file contains:
- ✅ All workouts (dates, names, exercises)
- ✅ All exercise groups (supersets, WODs, etc.)
- ✅ All coach accounts (usernames and password hashes)
- ✅ All exercise data (sets, reps, weight, tempo, rest, notes)

**⚠️ WARNING:** If you delete or overwrite this file, you will lose ALL your data!

## Database Location

### Docker Deployment (Production)
- **Host Path**: `/mnt/user/www/FitnessProgramming/instance/workouts.db`
- **Container Path**: `/app/instance/workouts.db`
- **Volume Mount**: `-v '/mnt/user/www/FitnessProgramming/instance':'/app/instance':'rw'`

### Non-Docker Deployment
- **Location**: `workouts.db` in the project root directory

## Safe Update Process

### Step 1: Backup the Database

**ALWAYS backup before making any changes:**

```bash
# Create a timestamped backup
cp /mnt/user/www/FitnessProgramming/instance/workouts.db \
   /mnt/user/www/FitnessProgramming/instance/workouts.db.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup was created
ls -lh /mnt/user/www/FitnessProgramming/instance/workouts.db.backup.*
```

### Step 2: Stop the Live Container

```bash
docker stop fitness-programming
```

### Step 3: Update Code Files

**Files you can safely replace/update:**
- ✅ `app.py`
- ✅ `run.py`
- ✅ `requirements.txt`
- ✅ `Dockerfile`
- ✅ `docker-compose.yml`
- ✅ `templates/` (all HTML files)
- ✅ `static/` (all CSS and JS files)
- ✅ `DEPLOYMENT.md`
- ✅ `README.md`
- ✅ `.gitignore`
- ✅ `.dockerignore`

**Files you must preserve:**
- ⚠️ `instance/workouts.db` (or `workouts.db`)
- ⚠️ `.env` (if using environment variables from file)

### Step 4: Copy Updated Files (Option A - Selective Copy)

```bash
# From your development location, copy files excluding instance/
cd /path/to/dev/FitnessProgramming
rsync -av --exclude='instance/' --exclude='*.db' --exclude='.git' \
  . /mnt/user/www/FitnessProgramming/
```

### Step 4: Copy Updated Files (Option B - Manual Copy)

```bash
# Copy individual directories/files
cp -r /path/to/dev/FitnessProgramming/templates /mnt/user/www/FitnessProgramming/
cp -r /path/to/dev/FitnessProgramming/static /mnt/user/www/FitnessProgramming/
cp /path/to/dev/FitnessProgramming/app.py /mnt/user/www/FitnessProgramming/
cp /path/to/dev/FitnessProgramming/run.py /mnt/user/www/FitnessProgramming/
cp /path/to/dev/FitnessProgramming/requirements.txt /mnt/user/www/FitnessProgramming/
cp /path/to/dev/FitnessProgramming/Dockerfile /mnt/user/www/FitnessProgramming/
cp /path/to/dev/FitnessProgramming/docker-compose.yml /mnt/user/www/FitnessProgramming/
# ... etc for other files

# DO NOT copy instance/ directory or any .db files!
```

### Step 5: Rebuild Docker Image

```bash
cd /mnt/user/www/FitnessProgramming
docker build -t nic/fitness-programming:latest .
```

### Step 6: Restart Container

```bash
docker start fitness-programming
# or if using docker-compose
docker-compose up -d
```

### Step 7: Verify Everything Works

1. **Check container logs:**
   ```bash
   docker logs fitness-programming
   ```
   Look for: "Created default admin account" (should only appear if database was empty)

2. **Test the application:**
   - Visit your app URL
   - Verify workouts are still visible
   - Try logging in as a coach
   - Test creating/editing a workout

3. **Verify database file:**
   ```bash
   ls -lh /mnt/user/www/FitnessProgramming/instance/workouts.db
   # Should show a file with size > 0 bytes
   ```

## Complete Update Script Example

Here's a complete script you can use for safe updates:

```bash
#!/bin/bash
set -e  # Exit on any error

PROD_DIR="/mnt/user/www/FitnessProgramming"
DEV_DIR="/path/to/dev/FitnessProgramming"
CONTAINER_NAME="fitness-programming"

echo "=== Fitness Programming Update Script ==="
echo ""

# Step 1: Backup
echo "1. Creating database backup..."
BACKUP_FILE="${PROD_DIR}/instance/workouts.db.backup.$(date +%Y%m%d_%H%M%S)"
cp "${PROD_DIR}/instance/workouts.db" "${BACKUP_FILE}"
echo "   Backup created: ${BACKUP_FILE}"
echo ""

# Step 2: Stop container
echo "2. Stopping container..."
docker stop ${CONTAINER_NAME} || true
echo "   Container stopped"
echo ""

# Step 3: Copy files (excluding instance and database files)
echo "3. Copying updated files..."
rsync -av --exclude='instance/' --exclude='*.db' --exclude='.git' --exclude='__pycache__' \
  "${DEV_DIR}/" "${PROD_DIR}/"
echo "   Files copied"
echo ""

# Step 4: Rebuild
echo "4. Rebuilding Docker image..."
cd "${PROD_DIR}"
docker build -t nic/fitness-programming:latest .
echo "   Image rebuilt"
echo ""

# Step 5: Restart
echo "5. Starting container..."
docker start ${CONTAINER_NAME}
echo "   Container started"
echo ""

# Step 6: Wait and verify
echo "6. Waiting for container to start..."
sleep 5

echo "7. Checking container status..."
docker ps | grep ${CONTAINER_NAME}

echo ""
echo "=== Update Complete ==="
echo "Verify your application is working correctly!"
echo "If anything goes wrong, restore from backup:"
echo "  cp ${BACKUP_FILE} ${PROD_DIR}/instance/workouts.db"
```

## Rollback Procedure

If something goes wrong after an update:

```bash
# Stop the container
docker stop fitness-programming

# Restore the database backup
cp /mnt/user/www/FitnessProgramming/instance/workouts.db.backup.YYYYMMDD_HHMMSS \
   /mnt/user/www/FitnessProgramming/instance/workouts.db

# Restart container
docker start fitness-programming
```

## Database Schema Changes

⚠️ **Important:** If you've made changes to the database schema (added/modified models in `app.py`), you may need to handle migrations:

1. **Test schema changes in development first**
2. **Backup production database before updating**
3. SQLAlchemy will automatically create new tables/columns, but won't delete old ones
4. If you need to remove columns or tables, you'll need to do it manually or use a migration tool

## Regular Backups

Set up automated backups:

```bash
# Add to crontab (crontab -e)
# Daily backup at 2 AM
0 2 * * * cp /mnt/user/www/FitnessProgramming/instance/workouts.db /mnt/user/www/FitnessProgramming/backups/workouts.db.$(date +\%Y\%m\%d)
```

Or use Unraid's built-in backup tools to backup the `instance/` directory.

## Checklist Before Updating

- [ ] Database backup created
- [ ] Container stopped
- [ ] Updated code files copied (excluding instance/)
- [ ] Docker image rebuilt
- [ ] Container restarted
- [ ] Application tested and verified
- [ ] All workouts still visible
- [ ] Coach login still works
- [ ] Can create/edit workouts

## Quick Reference

| Action | Command |
|--------|---------|
| Backup database | `cp instance/workouts.db instance/workouts.db.backup.$(date +%Y%m%d_%H%M%S)` |
| Stop container | `docker stop fitness-programming` |
| Rebuild image | `docker build -t nic/fitness-programming:latest .` |
| Start container | `docker start fitness-programming` |
| View logs | `docker logs -f fitness-programming` |
| Check container | `docker ps \| grep fitness-programming` |
| Verify database | `ls -lh instance/workouts.db` |

## Notes

- The `instance/` directory is mounted as a volume, so it persists outside the container
- Only the database file needs to be preserved - all code can be updated
- Always test updates in development first
- Keep multiple backups (daily/weekly) for safety
- Consider using Git to track code changes, but never commit the database file

