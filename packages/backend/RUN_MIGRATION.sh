#!/bin/bash

# Helper script to run Prisma migration with .env loaded from project root

cd "$(dirname "$0")" || exit 1

# Load .env from project root
if [ -f "../../.env" ]; then
  export $(cat ../../.env | grep -v '^#' | xargs)
fi

# Run the migration
npx prisma migrate dev

