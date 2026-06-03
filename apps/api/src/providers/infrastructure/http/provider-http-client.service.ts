import { Injectable } from '@nestjs/common';
import type { ProviderHttpRequest } from './provider-http.types';

@Injectable()
export class ProviderHttpClientService {
  async requestJson<T>(request: ProviderHttpRequest): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'content-type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Provider HTTP error: ${response.status}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
