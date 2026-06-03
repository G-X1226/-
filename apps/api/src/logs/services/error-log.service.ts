import { Injectable } from '@nestjs/common';
import { ErrorLogsRepository } from '../repositories/error-logs.repository';

@Injectable()
export class ErrorLogService {
  constructor(private readonly errorLogsRepository: ErrorLogsRepository) {}

  findRecent() {
    return this.errorLogsRepository.findRecent();
  }
}
