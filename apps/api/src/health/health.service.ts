import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisHealthService } from '../redis/redis-health.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthService,
  ) {}

  live(): { status: string } {
    return { status: 'ok' };
  }

  async ready(): Promise<{ status: string; checks: Record<string, boolean> }> {
    const database = await this.checkDatabase();
    const redis = await this.redisHealth.isReady();
    return { status: database && redis ? 'ok' : 'degraded', checks: { database, redis } };
  }

  private async checkDatabase(): Promise<boolean> {
    await this.prisma.$queryRaw`SELECT 1`;
    return true;
  }
}
