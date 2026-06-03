import { Injectable, TooManyRequestsException } from '@nestjs/common';
import type { AuthenticatedApiKey } from '../../api-keys/types/authenticated-api-key.type';
import { RedisRateLimitStoreService } from './redis-rate-limit-store.service';

const ONE_MINUTE_MS = 60_000;
const DEFAULT_API_KEY_RPM = 60;
const DEFAULT_API_KEY_TPM = 60_000;
const DEFAULT_IP_RPM = 120;

@Injectable()
export class RateLimitService {
  constructor(private readonly store: RedisRateLimitStoreService) {}

  async assertFixedWindow(key: string, limit: number, windowMs: number, incrementBy = 1): Promise<void> {
    const result = await this.store.fixedWindow(key, limit, windowMs, incrementBy);
    if (!result.allowed) {
      throw new TooManyRequestsException('Rate limit exceeded.');
    }
  }

  assertIpMinuteLimit(ip: string): Promise<void> {
    return this.assertFixedWindow(`ratelimit:ip:${ip}`, DEFAULT_IP_RPM, ONE_MINUTE_MS);
  }

  assertApiKeyMinuteLimit(apiKey: AuthenticatedApiKey): Promise<void> {
    return this.assertFixedWindow(
      `ratelimit:apikey:${apiKey.id}:rpm`,
      apiKey.rpmLimit ?? DEFAULT_API_KEY_RPM,
      ONE_MINUTE_MS,
    );
  }

  assertApiKeyTokenMinuteLimit(apiKey: AuthenticatedApiKey, tokens: number): Promise<void> {
    return this.assertFixedWindow(
      `ratelimit:apikey:${apiKey.id}:tpm`,
      apiKey.tpmLimit ?? DEFAULT_API_KEY_TPM,
      ONE_MINUTE_MS,
      Math.max(tokens, 1),
    );
  }
}
