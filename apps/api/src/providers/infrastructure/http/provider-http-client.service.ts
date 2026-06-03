import { Injectable } from '@nestjs/common';
import { classifyProviderStatus, ProviderError } from '../../domain/provider-error.type';
import type { ProviderHttpRequest, ProviderSseEvent } from './provider-http.types';

const MAX_ERROR_BODY_CHARS = 2_000;

@Injectable()
export class ProviderHttpClientService {
  async requestJson<T>(request: ProviderHttpRequest): Promise<T> {
    const response = await this.fetchWithTimeout(request);

    if (!response.ok) {
      await this.throwProviderHttpError(request.provider, response);
    }

    return (await response.json()) as T;
  }

  async *requestSse(request: ProviderHttpRequest): AsyncIterable<ProviderSseEvent> {
    const response = await this.fetchWithTimeout(request);

    if (!response.ok) {
      await this.throwProviderHttpError(request.provider, response);
    }

    if (!response.body) {
      throw new ProviderError('Provider returned an empty stream body.', {
        provider: request.provider,
        type: 'PROVIDER_NETWORK_ERROR',
        code: 'provider_empty_stream',
        retryable: true,
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const event = this.parseSseFrame(frame);
        if (event) yield event;
      }
    }

    buffer += decoder.decode();
    const event = this.parseSseFrame(buffer);
    if (event) yield event;
  }

  private async fetchWithTimeout(request: ProviderHttpRequest): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      return await fetch(request.url, {
        method: request.method,
        headers: {
          'content-type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      throw new ProviderError('Provider network request failed.', {
        provider: request.provider,
        type: error instanceof Error && error.name === 'AbortError' ? 'PROVIDER_TIMEOUT' : 'PROVIDER_NETWORK_ERROR',
        code: error instanceof Error && error.name === 'AbortError' ? 'provider_timeout' : 'provider_network_error',
        retryable: true,
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async throwProviderHttpError(provider: string, response: Response): Promise<never> {
    const options = classifyProviderStatus(provider, response.status);
    const body = (await response.text()).slice(0, MAX_ERROR_BODY_CHARS);

    throw new ProviderError(`Provider ${provider} returned HTTP ${response.status}: ${body}`, options);
  }

  private parseSseFrame(frame: string): ProviderSseEvent | null {
    if (!frame.trim()) return null;

    let event: string | undefined;
    const data: string[] = [];

    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice('event:'.length).trim();
      if (line.startsWith('data:')) data.push(line.slice('data:'.length).trimStart());
    }

    if (data.length === 0) return null;
    return { event, data: data.join('\n') };
  }
}
