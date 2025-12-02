import { Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Placeholder worker implementation
// TODO: Implement media processing workers

console.log('Worker service started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await connection.quit();
  process.exit(0);
});

