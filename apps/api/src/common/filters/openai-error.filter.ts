import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { isProviderError } from '../../providers/domain/provider-error.type';

@Catch()
export class OpenAiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.getStatus(exception);
    const message = exception instanceof Error ? exception.message : 'Unexpected server error.';

    response.status(status).json({
      error: {
        message,
        type: this.mapStatusToType(status),
        param: null,
        code: this.mapStatusToCode(status, exception),
      },
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (isProviderError(exception)) {
      if (exception.options.type === 'PROVIDER_RATE_LIMITED') return HttpStatus.TOO_MANY_REQUESTS;
      if (exception.options.type === 'PROVIDER_TIMEOUT') return HttpStatus.GATEWAY_TIMEOUT;
      if (exception.options.type === 'PROVIDER_AUTH_ERROR') return HttpStatus.BAD_GATEWAY;
      if (exception.options.type === 'PROVIDER_BAD_REQUEST') return HttpStatus.BAD_REQUEST;
      return HttpStatus.BAD_GATEWAY;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private mapStatusToType(status: number): string {
    if (status === HttpStatus.FORBIDDEN) return 'permission_error';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'rate_limit_exceeded';
    return status >= 500 ? 'server_error' : 'invalid_request_error';
  }

  private mapStatusToCode(status: number, exception: unknown): string {
    if (isProviderError(exception)) return exception.options.code;
    if (status === HttpStatus.UNAUTHORIZED) return 'invalid_api_key';
    if (status === HttpStatus.FORBIDDEN) return 'permission_denied';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'rate_limit_exceeded';
    return status >= 500 ? 'server_error' : 'invalid_request_error';
  }
}
