export interface ApiKeyResponseDto {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  status: string;
  environment: string;
  scopes: string[];
  allowedModels: string[] | null;
  allowedIps: string[] | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}

export interface CreatedApiKeyResponseDto extends ApiKeyResponseDto {
  key: string;
}
