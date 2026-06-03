export interface ProviderErrorOptions {
  provider: string;
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
  }
}
