import { Injectable } from '@nestjs/common';

@Injectable()
export class AuditLogService {
  recordPlaceholder(): string {
    return 'audit_log_reserved';
  }
}
