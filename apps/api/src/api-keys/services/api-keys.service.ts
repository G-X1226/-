import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { API_KEY_SCOPES } from '../../common/constants/scopes.constants';
import type { CreateApiKeyDto } from '../dto/create-api-key.dto';
import type { ApiKeyResponseDto, CreatedApiKeyResponseDto } from '../dto/api-key-response.dto';
import { ApiKeysRepository } from '../repositories/api-keys.repository';
import { ApiKeyGeneratorService } from './api-key-generator.service';
import { ApiKeyHasherService } from './api-key-hasher.service';

const DEFAULT_SCOPES = [API_KEY_SCOPES.CHAT_COMPLETIONS_CREATE];

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly apiKeysRepository: ApiKeysRepository,
    private readonly generator: ApiKeyGeneratorService,
    private readonly hasher: ApiKeyHasherService,
  ) {}

  async create(userId: string, dto: CreateApiKeyDto): Promise<CreatedApiKeyResponseDto> {
    const environment = dto.environment ?? 'LIVE';
    const key = this.generator.generate(environment);
    const created = await this.apiKeysRepository.create({
      userId,
      name: dto.name.trim(),
      prefix: this.generator.getPrefix(key),
      suffix: this.generator.getSuffix(key),
      hash: this.hasher.hash(key),
      environment,
      scopes: dto.scopes?.length ? dto.scopes : DEFAULT_SCOPES,
      allowedModels: dto.allowedModels?.length ? dto.allowedModels : undefined,
      allowedIps: dto.allowedIps?.length ? dto.allowedIps : undefined,
    });

    return { ...this.toResponse(created), key };
  }

  async list(userId: string): Promise<ApiKeyResponseDto[]> {
    const apiKeys = await this.apiKeysRepository.listByUserId(userId);
    return apiKeys.map((apiKey) => this.toResponse(apiKey));
  }

  async revoke(userId: string, apiKeyId: string): Promise<{ revoked: true }> {
    const existing = await this.apiKeysRepository.findByIdForUser(apiKeyId, userId);
    if (!existing) {
      throw new NotFoundException('API key was not found.');
    }

    if (existing.status !== 'ACTIVE') {
      throw new ForbiddenException('Only active API keys can be revoked.');
    }

    await this.apiKeysRepository.revoke(apiKeyId, userId);
    return { revoked: true };
  }

  private toResponse(apiKey: {
    id: string;
    name: string;
    prefix: string;
    suffix: string;
    status: string;
    environment: string;
    scopes: unknown;
    allowedModels: unknown;
    allowedIps: unknown;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    revokedAt: Date | null;
  }): ApiKeyResponseDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      suffix: apiKey.suffix,
      status: apiKey.status,
      environment: apiKey.environment,
      scopes: this.toStringArray(apiKey.scopes) ?? [],
      allowedModels: this.toStringArray(apiKey.allowedModels),
      allowedIps: this.toStringArray(apiKey.allowedIps),
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
      revokedAt: apiKey.revokedAt,
    };
  }

  private toStringArray(value: unknown): string[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    return value.filter((item): item is string => typeof item === 'string');
  }
}
