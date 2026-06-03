import { Injectable, NotFoundException } from '@nestjs/common';
import type { NormalizedChatRequest } from '../domain/normalized-chat-request.type';
import type { NormalizedChatResponse } from '../domain/normalized-chat-response.type';
import type { NormalizedStreamChunk } from '../domain/normalized-stream-chunk.type';
import { ProviderRegistryService } from './provider-registry.service';
import { ProviderRetryService } from './provider-retry.service';
import { ProviderTimeoutService } from './provider-timeout.service';

@Injectable()
export class ProviderExecutorService {
  constructor(
    private readonly registry: ProviderRegistryService,
    private readonly retry: ProviderRetryService,
    private readonly timeout: ProviderTimeoutService,
  ) {}

  execute(
    providerName: string,
    request: NormalizedChatRequest,
    options: { timeoutMs: number; maxRetries: number },
  ): Promise<NormalizedChatResponse> {
    const provider = this.registry.get(providerName);
    if (!provider) {
      throw new NotFoundException(`Provider ${providerName} is not registered.`);
    }

    return this.retry.execute(
      () => this.timeout.withTimeout(provider.chatCompletion(request), options.timeoutMs),
      options.maxRetries,
    );
  }

  stream(
    providerName: string,
    request: NormalizedChatRequest,
  ): AsyncIterable<NormalizedStreamChunk> {
    const provider = this.registry.get(providerName);
    if (!provider) {
      throw new NotFoundException(`Provider ${providerName} is not registered.`);
    }

    return provider.streamChatCompletion(request);
  }
}
