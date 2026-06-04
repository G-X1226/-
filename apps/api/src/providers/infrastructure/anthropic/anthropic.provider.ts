import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistryService } from '../../application/provider-registry.service';
import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';
import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';
import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';
import { ProviderError } from '../../domain/provider-error.type';
import type { ModelProvider } from '../../domain/provider.interface';
import { ProviderHttpClientService } from '../http/provider-http-client.service';
import { mapAnthropicRequest } from './anthropic-request.mapper';
import { mapAnthropicResponse } from './anthropic-response.mapper';
import { mapAnthropicStreamChunk } from './anthropic-stream.mapper';

const DEFAULT_ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';

@Injectable()
export class AnthropicProvider implements ModelProvider, OnModuleInit {
  readonly name = 'anthropic';

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
      url: `${this.baseUrl()}/messages`,
      method: 'POST',
      headers: this.authHeaders(),
      body: mapAnthropicRequest({ ...request, stream: false }),
      timeoutMs: 60_000,
    });

    return mapAnthropicResponse(raw, this.name);
  }

  async *streamChatCompletion(request: NormalizedChatRequest): AsyncIterable<NormalizedStreamChunk> {
    for await (const event of this.http.requestSse({
      provider: this.name,
      url: `${this.baseUrl()}/messages`,
      method: 'POST',
      headers: this.authHeaders(),
      body: mapAnthropicRequest({ ...request, stream: true }),
      timeoutMs: 60_000,
    })) {
      if (event.data === '[DONE]') break;
      const chunk = mapAnthropicStreamChunk(JSON.parse(event.data) as Record<string, unknown>);
      if (chunk) yield chunk;
    }
  }

  private baseUrl(): string {
    return (this.config.get<string>('ANTHROPIC_BASE_URL') ?? DEFAULT_ANTHROPIC_BASE_URL).replace(/\/$/, '');
  }

  private authHeaders(): Record<string, string> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new ProviderError('ANTHROPIC_API_KEY is not configured.', {
        provider: this.name,
        type: 'PROVIDER_AUTH_ERROR',
        code: 'provider_missing_api_key',
        retryable: false,
      });
    }

    return {
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    };
  }
}
