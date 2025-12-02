import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async basic() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('detailed')
  async detailed() {
    const checks: Record<string, any> = {
      api: { status: 'ok' },
      database: { status: 'unknown' },
      timestamp: new Date().toISOString(),
    };

    // Check database connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'ok' };
    } catch (error) {
      checks.database = { 
        status: 'error', 
        error: error instanceof Error ? error.message : String(error) 
      };
    }

    return checks;
  }
}
