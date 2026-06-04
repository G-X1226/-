export interface CreateErrorLogInput {
  requestId?: string;
  requestLogId?: string;
  userId?: string;
  apiKeyId?: string;
  errorType: string;
  errorCode: string;
  message: string;
  providerName?: string;
  upstreamStatusCode?: number;
  metadata?: Record<string, unknown>;
}
