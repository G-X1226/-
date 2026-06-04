export interface StartRequestLogInput {
  requestId: string;
  userId?: string;
  apiKeyId?: string;
  modelId?: string;
  providerId?: string;
  endpoint: string;
  method: string;
  stream: boolean;
  clientIp?: string;
  userAgent?: string;
}

export interface CompleteRequestLogInput {
  requestId: string;
  modelId?: string;
  providerId?: string;
  latencyMs?: number;
  upstreamLatencyMs?: number;
  upstreamStatusCode?: number;
  errorCode?: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'CLIENT_ABORTED';
}
