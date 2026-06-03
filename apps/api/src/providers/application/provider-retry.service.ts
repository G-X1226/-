import { Injectable } from '@nestjs/common';

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
        attempt += 1;
      }
    }

    throw lastError;
  }
}
