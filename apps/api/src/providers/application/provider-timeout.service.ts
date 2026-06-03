import { Injectable } from '@nestjs/common';

@Injectable()
export class ProviderTimeoutService {
  withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        setTimeout(() => reject(new Error(`Provider timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  }
}
