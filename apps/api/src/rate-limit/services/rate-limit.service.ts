import { Injectable, TooManyRequestsException } from '@nestjs/common';
import { RedisRateLimitStoreService } from './redis-rate-limit-store.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly store: RedisRateLimitStoreService) {}

  async assertFixedWindow(key: string, limit: number, windowMs: number): Promise<void> {
    const result = await this.store.fixedWindow(key, limit, windowMs);
    if (!result.allowed) {
      throw new TooManyRequestsException('Rate limit exceeded.');
    }
  }
}
