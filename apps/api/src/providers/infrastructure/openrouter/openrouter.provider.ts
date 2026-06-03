import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProviderRegistryService } from '../../application/provider-registry.service';
import type { ModelProvider } from '../../domain/provider.interface';
import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';
import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';
import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';

@Injectable()
export class OpenRouterProvider implements ModelProvider, OnModuleInit {
  readonly name = 'openrouter';

  constructor(private readonly registry: ProviderRegistryService) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  chatCompletion(_request: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    throw new Error('OpenRouter adapter will be implemented in step 7.');
  }

  async *streamChatCompletion(_request: NormalizedChatRequest): AsyncIterable<NormalizedStreamChunk> {
    throw new Error('OpenRouter streaming adapter will be implemented in step 7.');
  }
}
