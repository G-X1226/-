import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistryService } from '../../application/provider-registry.service';
import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';
import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';
import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';
import { ProviderError } from '../../domain/provider-error.type';
import type { ModelProvider } from '../../domain/provider.interface';
import { ProviderHttpClientService } from '../http/provider-http-client.service';
import { mapOpenaiRequest } from './openai-request.mapper';
import { mapOpenaiResponse } from './openai-response.mapper';
import { mapOpenaiStreamChunk } from './openai-stream.mapper';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

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
      provider: this.name,
      url: `${this.baseUrl()}/chat/completions`,
      method: 'POST',
      headers: this.authHeaders(),
      body: mapOpenaiRequest({ ...request, stream: false }),
      timeoutMs: 60_000,
    });

    return mapOpenaiResponse(raw, this.name);
  }

  async *streamChatCompletion(request: NormalizedChatRequest): AsyncIterable<NormalizedStreamChunk> {
    for await (const event of this.http.requestSse({
      provider: this.name,
      url: `${this.baseUrl()}/chat/completions`,
      method: 'POST',
      headers: this.authHeaders(),
      body: mapOpenaiRequest({ ...request, stream: true }),
      timeoutMs: 60_000,
    })) {
      if (event.data === '[DONE]') break;
      yield mapOpenaiStreamChunk(JSON.parse(event.data) as Record<string, unknown>);
    }
  }

  private baseUrl(): string {
    return (this.config.get<string>('OPENAI_BASE_URL') ?? DEFAULT_OPENAI_BASE_URL).replace(/\/$/, '');
  }

  private authHeaders(): Record<string, string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new ProviderError('OPENAI_API_KEY is not configured.', {
        provider: this.name,
        type: 'PROVIDER_AUTH_ERROR',
        code: 'provider_missing_api_key',
        retryable: false,
      });
    }

    return { authorization: `Bearer ${apiKey}` };
  }
}
