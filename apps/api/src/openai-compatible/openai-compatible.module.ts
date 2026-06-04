import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { BillingModule } from '../billing/billing.module';
import { LogsModule } from '../logs/logs.module';
import { ModelRoutingModule } from '../model-routing/model-routing.module';
import { ProvidersModule } from '../providers/providers.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { UsageModule } from '../usage/usage.module';
import { ChatCompletionsController } from './controllers/chat-completions.controller';
import { ModelsController } from './controllers/models.controller';
import { ChatCompletionsService } from './services/chat-completions.service';
import { ModelsService } from './services/models.service';
import { OpenAiErrorMapperService } from './services/openai-error-mapper.service';
import { OpenAiResponseMapperService } from './services/openai-response-mapper.service';
import { SseResponseService } from './services/sse-response.service';

@Module({
  imports: [ApiKeysModule, RateLimitModule, ModelRoutingModule, ProvidersModule, BillingModule, UsageModule, LogsModule],
  controllers: [ChatCompletionsController, ModelsController],
  providers: [
    ChatCompletionsService,
    ModelsService,
    OpenAiResponseMapperService,
    OpenAiErrorMapperService,
    SseResponseService,
  ],
})
export class OpenAiCompatibleModule {}
