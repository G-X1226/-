export interface ProviderHttpRequest {
  provider: string;
  url: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
}

export interface ProviderSseEvent {
  event?: string;
  data: string;
}
