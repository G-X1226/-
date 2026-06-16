import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisHealthService } from './redis-health.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
    RedisService,
    RedisHealthService,
  ],
  exports: [RedisService, RedisHealthService],
})
export class RedisModule {}
