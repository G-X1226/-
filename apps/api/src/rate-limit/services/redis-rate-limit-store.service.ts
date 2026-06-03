import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import type { RateLimitResult } from '../types/rate-limit-result.type';

@Injectable()
export class RedisRateLimitStoreService {
  constructor(private readonly redis: RedisService) {}

  async fixedWindow(key: string, limit: number, windowMs: number, incrementBy = 1): Promise<RateLimitResult> {
    const client = this.redis.getClient();
    const count = await client.incrby(key, incrementBy);
    if (count === incrementBy) {
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
