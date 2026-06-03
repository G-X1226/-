import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistryService } from '../../application/provider-registry.service';
import type { ModelProvider } from '../../domain/provider.interface';
import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';
import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';
import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';
import { ProviderHttpClientService } from '../http/provider-http-client.service';
import { mapOpenaiRequest } from './openai-request.mapper';
import { mapOpenaiResponse } from './openai-response.mapper';

@Injectable()
export class OpenAiProvider implements ModelProvider, OnModuleInit {
  readonly name = 'openai';

  constructor(
    private readonly config: ConfigService,
    private readonly http: ProviderHttpClientService,
    private readonly registry: ProviderRegistryService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async chatCompletion(request: NormalizedChatRequest): Promise<NormalizedChatResponse> {
    const raw = await this.http.requestJson<Record<string, unknown>>({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: { authorization: `Bearer ${this.config.get<string>('OPENAI_API_KEY') ?? ''}` },
      body: mapOpenaiRequest(request),
      timeoutMs: 60_000,
    });

    return mapOpenaiResponse(raw, this.name);
  }

  async *streamChatCompletion(_request: NormalizedChatRequest): AsyncIterable<NormalizedStreamChunk> {
    throw new Error('OpenAI streaming adapter will be implemented in step 7.');
  }
}
