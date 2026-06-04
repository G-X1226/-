import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { LogsModule } from './logs/logs.module';
import { ModelRoutingModule } from './model-routing/model-routing.module';
import { OpenAiCompatibleModule } from './openai-compatible/openai-compatible.module';
import { ProvidersModule } from './providers/providers.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RedisModule } from './redis/redis.module';
import { UsageModule } from './usage/usage.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    UsersModule,
    AuthModule,
    ApiKeysModule,
    ProvidersModule,
    ModelRoutingModule,
    BillingModule,
    UsageModule,
    RateLimitModule,
    LogsModule,
    OpenAiCompatibleModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
