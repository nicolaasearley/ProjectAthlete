#!/bin/bash
# Clean install script for Expo project
# Removes node_modules, package-lock.json, and .expo cache
# Then reinstalls all dependencies

set -e

echo "🧹 Cleaning project..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .expo

echo "📦 Installing dependencies..."
npm install

echo "✅ Clean install complete!"
echo "🚀 You can now run: npx expo start --clear"

