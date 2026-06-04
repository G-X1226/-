import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  record(event: string, metadata: Record<string, unknown> = {}): void {
    this.logger.log({ event, metadata });
  }
}
