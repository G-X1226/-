import { Module } from '@nestjs/common';
import { ProviderExecutorService } from './application/provider-executor.service';
import { ProviderRegistryService } from './application/provider-registry.service';
import { ProviderRetryService } from './application/provider-retry.service';
import { ProviderTimeoutService } from './application/provider-timeout.service';
import { AnthropicProvider } from './infrastructure/anthropic/anthropic.provider';
import { GeminiProvider } from './infrastructure/gemini/gemini.provider';
import { ProviderHttpClientService } from './infrastructure/http/provider-http-client.service';
import { OpenAiProvider } from './infrastructure/openai/openai.provider';
import { OpenRouterProvider } from './infrastructure/openrouter/openrouter.provider';

@Module({
  providers: [
    ProviderRegistryService,
    ProviderExecutorService,
    ProviderRetryService,
    ProviderTimeoutService,
    ProviderHttpClientService,
    OpenAiProvider,
    AnthropicProvider,
    GeminiProvider,
    OpenRouterProvider,
  ],
  exports: [ProviderExecutorService, ProviderRegistryService],
})
export class ProvidersModule {}
