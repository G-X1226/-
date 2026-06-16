import { Module } from '@nestjs/common';
import { ApiKeyRateLimitGuard } from './guards/api-key-rate-limit.guard';
import { IpRateLimitGuard } from './guards/ip-rate-limit.guard';
import { TokenRateLimitGuard } from './guards/token-rate-limit.guard';
import { RateLimitPolicyService } from './services/rate-limit-policy.service';
import { RateLimitService } from './services/rate-limit.service';
import { RedisRateLimitStoreService } from './services/redis-rate-limit-store.service';

@Module({
  providers: [
    RateLimitService,
    RateLimitPolicyService,
    RedisRateLimitStoreService,
    IpRateLimitGuard,
    ApiKeyRateLimitGuard,
    TokenRateLimitGuard,
  ],
  exports: [RateLimitService, IpRateLimitGuard, ApiKeyRateLimitGuard, TokenRateLimitGuard],
})
export class RateLimitModule {}
