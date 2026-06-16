import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hmacSha256, safeCompare } from '../../common/utils/crypto.util';

@Injectable()
export class ApiKeyHasherService {
  constructor(private readonly config: ConfigService) {}

  hash(apiKey: string): string {
    return hmacSha256(apiKey, this.config.getOrThrow<string>('API_KEY_HASH_SECRET'));
  }

  verify(apiKey: string, expectedHash: string): boolean {
    return safeCompare(this.hash(apiKey), expectedHash);
  }
}
