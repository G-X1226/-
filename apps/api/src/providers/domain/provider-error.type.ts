export type ProviderErrorType =
  | 'PROVIDER_AUTH_ERROR'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_BAD_REQUEST'
  | 'PROVIDER_OVERLOADED'
  | 'PROVIDER_SERVER_ERROR'
  | 'PROVIDER_NETWORK_ERROR'
  | 'PROVIDER_UNKNOWN_ERROR';

export interface ProviderErrorOptions {
  provider: string;
  type: ProviderErrorType;
  code: string;
  retryable: boolean;
  statusCode?: number;
  cause?: unknown;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly options: ProviderErrorOptions,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}

export function classifyProviderStatus(provider: string, statusCode: number): ProviderErrorOptions {
  if (statusCode === 401 || statusCode === 403) {
    return {
      provider,
      type: 'PROVIDER_AUTH_ERROR',
      code: 'provider_auth_error',
      retryable: false,
      statusCode,
    };
  }

  if (statusCode === 400 || statusCode === 404) {
    return {
      provider,
      type: 'PROVIDER_BAD_REQUEST',
      code: 'provider_bad_request',
      retryable: false,
      statusCode,
    };
  }

  if (statusCode === 408 || statusCode === 429) {
    return {
      provider,
      type: statusCode === 429 ? 'PROVIDER_RATE_LIMITED' : 'PROVIDER_TIMEOUT',
      code: statusCode === 429 ? 'provider_rate_limited' : 'provider_timeout',
      retryable: true,
      statusCode,
    };
  }

  if (statusCode === 529) {
    return {
      provider,
      type: 'PROVIDER_OVERLOADED',
      code: 'provider_overloaded',
      retryable: true,
      statusCode,
    };
  }

  return {
    provider,
    type: statusCode >= 500 ? 'PROVIDER_SERVER_ERROR' : 'PROVIDER_UNKNOWN_ERROR',
    code: statusCode >= 500 ? 'provider_server_error' : 'provider_unknown_error',
    retryable: statusCode >= 500,
    statusCode,
  };
}
