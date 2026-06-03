import { Injectable } from '@nestjs/common';
import { createSecureToken } from '../../common/utils/crypto.util';

@Injectable()
export class ApiKeyGeneratorService {
  generate(environment: 'live' | 'test' = 'live'): string {
    return `sk_${environment}_${createSecureToken(32)}`;
  }

  getPrefix(apiKey: string): string {
    return apiKey.slice(0, 20);
  }

  getSuffix(apiKey: string): string {
    return apiKey.slice(-6);
  }
}
