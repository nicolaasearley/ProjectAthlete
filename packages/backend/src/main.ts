import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Import CommonJS module using TypeScript import assignment
import cookieParser = require('cookie-parser');

// Load environment variables from root directory
// process.cwd() will be the project root when running from root, or packages/backend when running from there
const rootPath = process.cwd().includes('packages/backend') 
  ? path.resolve(process.cwd(), '..', '..')
  : process.cwd();

// Try loading from root directory first
const envPath = path.join(rootPath, '.env');
const envLocalPath = path.join(rootPath, '.env.local');
dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath });
dotenv.config(); // Also try current working directory

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable cookie parser for refresh tokens
  app.use(cookieParser());

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration - allow multiple origins
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Always allow localhost and local network IP origins (for local development/production)
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('192.168.') ||
          origin.includes('172.16.') ||
          origin.includes('10.')) {
        return callback(null, true);
      }
      
      // Check against explicitly allowed origins
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS: Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = parseInt(process.env.API_PORT || '3000', 10);
  const host = process.env.API_HOST || '0.0.0.0'; // Listen on all interfaces
  
  console.log(`🔌 Starting server on ${host}:${port}...`);
  
  try {
    await app.listen(port, host);
    console.log(`🚀 Application is running on: http://${host}:${port}/api/v1`);
    console.log(`✅ Server is ready to accept connections`);
  } catch (error: any) {
    console.error(`❌ Failed to start server:`, error);
    console.error(`Error code: ${error.code}`);
    console.error(`Error message: ${error.message}`);
    if (error.stack) {
      console.error(`Stack trace:`, error.stack);
    }
    
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
      console.error(`💡 Try one of the following:`);
      console.error(`   1. Kill the process using port ${port}: lsof -ti:${port} | xargs kill -9`);
      console.error(`   2. Use a different port: API_PORT=3001 npm run dev`);
      console.error(`   3. Check Docker containers: docker ps --filter "publish=${port}"`);
    }
    process.exit(1);
  }
}

// Catch any unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

bootstrap().catch((error) => {
  console.error('❌ Failed to bootstrap application:', error);
  process.exit(1);
});

