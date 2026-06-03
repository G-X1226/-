import { Injectable } from '@nestjs/common';

@Injectable()
export class LogSanitizerService {
  sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [
        key,
        key.toLowerCase() === 'authorization' ? '[REDACTED]' : value,
      ]),
    );
  }
}
