import { Module } from '@nestjs/common';
import { ErrorLogsRepository } from './repositories/error-logs.repository';
import { RequestLogsRepository } from './repositories/request-logs.repository';
import { AuditLogService } from './services/audit-log.service';
import { ErrorLogService } from './services/error-log.service';
import { LogSanitizerService } from './services/log-sanitizer.service';
import { RequestLogService } from './services/request-log.service';

@Module({
  providers: [
    RequestLogService,
    ErrorLogService,
    AuditLogService,
    LogSanitizerService,
    RequestLogsRepository,
    ErrorLogsRepository,
  ],
  exports: [RequestLogService, ErrorLogService, AuditLogService, LogSanitizerService],
})
export class LogsModule {}
