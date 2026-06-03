import { Injectable } from '@nestjs/common';
import { ErrorLogsRepository } from '../repositories/error-logs.repository';
import type { CreateErrorLogInput } from '../types/error-log-entry.type';

@Injectable()
export class ErrorLogService {
  constructor(private readonly errorLogsRepository: ErrorLogsRepository) {}

  create(input: CreateErrorLogInput) {
    return this.errorLogsRepository.create(input);
  }

  findRecent() {
    return this.errorLogsRepository.findRecent();
  }
}
