import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderRegistryService } from '../../application/provider-registry.service';
import type { NormalizedChatRequest } from '../../domain/normalized-chat-request.type';
import type { NormalizedChatResponse } from '../../domain/normalized-chat-response.type';
import type { NormalizedStreamChunk } from '../../domain/normalized-stream-chunk.type';
import { ProviderError } from '../../domain/provider-error.type';
import type { ModelProvider } from '../../domain/provider.interface';
import { ProviderHttpClientService } from '../http/provider-http-client.service';
import { buildGeminiUrl, mapGeminiRequest } from './gemini-request.mapper';
import { mapGeminiResponse } from './gemini-response.mapper';
import { mapGeminiStreamChunk } from './gemini-stream.mapper';

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

@Injectable()
export class GeminiProvider implements ModelProvider, OnModuleInit {
  readonly name = 'gemini';

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
      url: buildGeminiUrl(this.baseUrl(), request.providerModel, this.apiKey(), false),
      method: 'POST',
      body: mapGeminiRequest({ ...request, stream: false }),
      timeoutMs: 60_000,
    });

    return mapGeminiResponse(raw, this.name, request.model);
  }

  async *streamChatCompletion(request: NormalizedChatRequest): AsyncIterable<NormalizedStreamChunk> {
    for await (const event of this.http.requestSse({
      provider: this.name,
      url: buildGeminiUrl(this.baseUrl(), request.providerModel, this.apiKey(), true),
      method: 'POST',
      body: mapGeminiRequest({ ...request, stream: true }),
      timeoutMs: 60_000,
    })) {
      if (event.data === '[DONE]') break;
      yield mapGeminiStreamChunk(JSON.parse(event.data) as Record<string, unknown>, request.model);
    }
  }

  private baseUrl(): string {
    return (this.config.get<string>('GEMINI_BASE_URL') ?? DEFAULT_GEMINI_BASE_URL).replace(/\/$/, '');
  }

  private apiKey(): string {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ProviderError('GEMINI_API_KEY is not configured.', {
        provider: this.name,
        type: 'PROVIDER_AUTH_ERROR',
        code: 'provider_missing_api_key',
        retryable: false,
      });
    }

    return apiKey;
  }
}
