#!/usr/bin/env node

/**
 * Helper script to run Prisma commands with .env loaded from project root
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { execSync } = require('child_process');

// Get the command to run (everything after this script name)
const args = process.argv.slice(2);
const command = args.join(' ');

if (!command) {
  console.error('Usage: node run-prisma-with-env.js <prisma-command>');
  console.error('Example: node run-prisma-with-env.js migrate dev');
  process.exit(1);
}

// Run the command
try {
  execSync(`npx prisma ${command}`, {
    stdio: 'inherit',
    cwd: __dirname,
    env: process.env,
  });
} catch (error) {
  process.exit(error.status || 1);
}

