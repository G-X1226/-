import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class OpenAiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof Error ? exception.message : 'Unexpected server error.';

    response.status(status).json({
      error: {
        message,
        type: status >= 500 ? 'server_error' : 'invalid_request_error',
        param: null,
        code: this.mapStatusToCode(status),
      },
    });
  }

  private mapStatusToCode(status: number): string {
    if (status === HttpStatus.UNAUTHORIZED) return 'invalid_api_key';
    if (status === HttpStatus.FORBIDDEN) return 'permission_denied';
    if (status === HttpStatus.TOO_MANY_REQUESTS) return 'rate_limit_exceeded';
    return status >= 500 ? 'server_error' : 'invalid_request_error';
  }
}
