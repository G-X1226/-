import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedApiKey } from '../types/authenticated-api-key.type';
import { ApiKeysRepository } from '../repositories/api-keys.repository';
import { ApiKeyGeneratorService } from './api-key-generator.service';
import { ApiKeyHasherService } from './api-key-hasher.service';

@Injectable()
export class ApiKeyAuthService {
  constructor(
    private readonly apiKeysRepository: ApiKeysRepository,
    private readonly generator: ApiKeyGeneratorService,
    private readonly hasher: ApiKeyHasherService,
  ) {}

  async authenticate(rawApiKey: string, clientIp?: string): Promise<AuthenticatedApiKey> {
    const prefix = this.generator.getPrefix(rawApiKey);
    const candidates = await this.apiKeysRepository.findActiveByPrefix(prefix);
    const apiKey = candidates.find((candidate) => this.hasher.verify(rawApiKey, candidate.hash));

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key.');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired.');
    }

    if (apiKey.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('API key owner is inactive.');
    }

    const allowedIps = this.toStringArray(apiKey.allowedIps);
    if (allowedIps && clientIp && !allowedIps.includes(clientIp)) {
      throw new UnauthorizedException('API key is not allowed from this IP address.');
    }

    void this.apiKeysRepository.touchLastUsedAt(apiKey.id).catch(() => undefined);

    return {
      id: apiKey.id,
      userId: apiKey.userId,
      userStatus: apiKey.user.status,
      scopes: this.toStringArray(apiKey.scopes) ?? [],
      allowedModels: this.toStringArray(apiKey.allowedModels),
      rateLimitPolicyId: apiKey.rateLimitPolicyId,
    };
  }

  private toStringArray(value: unknown): string[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    return value.filter((item): item is string => typeof item === 'string');
  }
}
