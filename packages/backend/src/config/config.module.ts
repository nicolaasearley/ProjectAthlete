import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as path from 'path';

// Resolve the root directory (go up from packages/backend to project root)
// process.cwd() will be the project root when running from root, or packages/backend when running from there
const rootPath = process.cwd().includes('packages/backend') 
  ? path.resolve(process.cwd(), '..', '..')
  : process.cwd();

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.join(rootPath, '.env.local'),
        path.join(rootPath, '.env'),
        path.join(process.cwd(), '.env.local'),
        path.join(process.cwd(), '.env'),
      ],
      cache: true,
      expandVariables: true,
    }),
  ],
})
export class ConfigModule {}
