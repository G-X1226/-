import { Injectable } from '@nestjs/common';
import type { TokenUsageRecord } from '../types/token-usage.type';

@Injectable()
export class TokenUsageNormalizerService {
  normalize(usage?: Partial<TokenUsageRecord>): TokenUsageRecord {
    const promptTokens = usage?.promptTokens ?? 0;
    const completionTokens = usage?.completionTokens ?? 0;
    return {
      promptTokens,
      completionTokens,
      totalTokens: usage?.totalTokens ?? promptTokens + completionTokens,
    };
  }
}
