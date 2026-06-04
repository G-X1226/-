export interface BillingChargeInput {
  requestId: string;
  userId: string;
  apiKeyId?: string;
  modelId?: string;
  providerId?: string;
  providerModel?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costCreditsMicro: bigint;
  providerCostMicro?: bigint;
  status?: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'ESTIMATED';
}

export interface BillingChargeResult {
  usageRecordId: string;
  chargedCreditsMicro: bigint;
  freeCreditsUsedMicro: bigint;
  paidCreditsUsedMicro: bigint;
  balanceAfterCreditsMicro: bigint;
}
