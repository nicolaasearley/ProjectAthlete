#!/bin/bash

echo "🔧 Reinstalling migration dependencies..."
echo ""

cd "$(dirname "$0")" || exit 1

# Remove node_modules and package-lock.json
echo "🗑️  Removing old dependencies..."
rm -rf node_modules package-lock.json

# Reinstall
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Dependencies reinstalled successfully!"
  echo ""
  echo "Now try running the migration again:"
  echo "   ./RUN_WORKOUT_MIGRATION.sh"
else
  echo ""
  echo "❌ Failed to install dependencies"
  exit 1
fi



