import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import type { RateLimitResult } from '../types/rate-limit-result.type';

@Injectable()
export class RedisRateLimitStoreService {
  constructor(private readonly redis: RedisService) {}

  async fixedWindow(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const client = this.redis.getClient();
    const count = await client.incr(key);
    if (count === 1) {
      await client.pexpire(key, windowMs);
    }
    const ttl = await client.pttl(key);

    return {
      allowed: count <= limit,
      remaining: Math.max(limit - count, 0),
      resetAt: new Date(Date.now() + Math.max(ttl, 0)),
    };
  }
}
