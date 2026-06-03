export interface ProviderHttpRequest {
  url: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
}
