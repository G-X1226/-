import { Injectable, UnauthorizedException } from '@nestjs/common';
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

  async authenticate(rawApiKey: string) {
    const prefix = this.generator.getPrefix(rawApiKey);
    const apiKey = await this.apiKeysRepository.findActiveByPrefix(prefix);

    if (!apiKey || !this.hasher.verify(rawApiKey, apiKey.hash)) {
      throw new UnauthorizedException('Invalid API key.');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired.');
    }

    return apiKey;
  }
}
