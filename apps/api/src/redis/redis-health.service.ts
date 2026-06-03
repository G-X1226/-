import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisHealthService {
  constructor(private readonly redis: RedisService) {}

  async isReady(): Promise<boolean> {
    return (await this.redis.ping()) === 'PONG';
  }
}
