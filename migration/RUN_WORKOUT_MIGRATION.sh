#!/bin/bash

echo "🚀 Workout Migration Script"
echo "=========================="
echo ""

cd "$(dirname "$0")" || exit 1

# Check if old database exists
OLD_DB_PATH="${OLD_DB_PATH:-../Old_Site/instance/workouts.db}"
if [ ! -f "$OLD_DB_PATH" ]; then
  echo "❌ Old database not found at: $OLD_DB_PATH"
  echo "   Please set OLD_DB_PATH environment variable or ensure the path is correct"
  exit 1
fi

echo "✅ Found old database: $OLD_DB_PATH"

# Check if .env exists in root
if [ ! -f "../.env" ]; then
  echo "⚠️  Warning: ../.env not found. DATABASE_URL must be set."
fi

# Check if node_modules exists or if ts-node is broken
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/ts-node" ] || ! node_modules/.bin/ts-node --version >/dev/null 2>&1; then
  echo "📦 Installing/repairing dependencies..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
  fi
fi

# Check for dry-run flag
DRY_RUN=""
if [ "$1" == "--dry-run" ]; then
  DRY_RUN="--dry-run"
  echo "🔍 Running in DRY-RUN mode (no changes will be made)"
fi

echo ""
echo "🔧 Running migration..."
echo ""

# Export OLD_DB_PATH for the script
export OLD_DB_PATH

# Ensure node_modules/.bin is in PATH for npx
export PATH="$PWD/node_modules/.bin:$PATH"

# Run migration script
npm run migrate $DRY_RUN

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully!"
else
  echo ""
  echo "❌ Migration failed!"
  exit 1
fi

