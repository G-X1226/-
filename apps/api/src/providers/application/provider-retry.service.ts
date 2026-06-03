import { Injectable } from '@nestjs/common';
import { isProviderError } from '../domain/provider-error.type';

@Injectable()
export class ProviderRetryService {
  async execute<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (!isProviderError(error) || !error.options.retryable || attempt === maxRetries) {
          throw error;
        }
        attempt += 1;
      }
    }

    throw lastError;
  }
}
