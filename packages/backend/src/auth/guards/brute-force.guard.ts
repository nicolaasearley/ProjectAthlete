import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class BruteForceGuard implements CanActivate {
  private redis: Redis;
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    const email = request.body?.email;

    if (!email) {
      return true; // Let validation handle missing email
    }

    const key = `login_attempts:${email}:${ip}`;
    const attempts = await this.redis.get(key);

    if (attempts && parseInt(attempts) >= this.MAX_ATTEMPTS) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many login attempts. Please try again in 15 minutes.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  async recordFailedAttempt(email: string, ip: string): Promise<void> {
    const key = `login_attempts:${email}:${ip}`;
    const attempts = await this.redis.incr(key);
    await this.redis.expire(key, this.LOCKOUT_DURATION);
  }

  async clearAttempts(email: string, ip: string): Promise<void> {
    const key = `login_attempts:${email}:${ip}`;
    await this.redis.del(key);
  }
}
