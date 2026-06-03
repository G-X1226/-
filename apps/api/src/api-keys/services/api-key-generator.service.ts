import { Injectable } from '@nestjs/common';
import { createSecureToken } from '../../common/utils/crypto.util';

@Injectable()
export class ApiKeyGeneratorService {
  generate(environment: 'LIVE' | 'TEST' = 'LIVE'): string {
    return `sk_${environment.toLowerCase()}_${createSecureToken(32)}`;
  }

  getPrefix(apiKey: string): string {
    return apiKey.slice(0, 20);
  }

  getSuffix(apiKey: string): string {
    return apiKey.slice(-6);
  }
}
