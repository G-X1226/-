export interface TokenUsageRecord {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CreateUsageRecordInput extends TokenUsageRecord {
  requestId: string;
  userId: string;
  apiKeyId?: string;
  modelId?: string;
  providerId?: string;
  providerModel?: string;
  costCreditsMicro: bigint;
  providerCostMicro?: bigint;
  status?: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'ESTIMATED';
}
