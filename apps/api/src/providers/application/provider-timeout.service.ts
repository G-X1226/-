import { Injectable } from '@nestjs/common';
import { ProviderError } from '../domain/provider-error.type';

@Injectable()
export class ProviderTimeoutService {
  withTimeout<T>(provider: string, promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    return Promise.race([
      promise.finally(() => {
        if (timeout) clearTimeout(timeout);
      }),
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new ProviderError(`Provider timeout after ${timeoutMs}ms`, {
                provider,
                type: 'PROVIDER_TIMEOUT',
                code: 'provider_timeout',
                retryable: true,
              }),
            ),
          timeoutMs,
        );
      }),
    ]);
  }
}
