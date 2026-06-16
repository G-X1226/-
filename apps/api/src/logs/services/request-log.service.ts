import { Injectable } from '@nestjs/common';
import { RequestLogsRepository } from '../repositories/request-logs.repository';
import type { CompleteRequestLogInput, StartRequestLogInput } from '../types/request-log-entry.type';

@Injectable()
export class RequestLogService {
  constructor(private readonly requestLogsRepository: RequestLogsRepository) {}

  start(input: StartRequestLogInput) {
    return this.requestLogsRepository.create(input);
  }

  complete(input: CompleteRequestLogInput) {
    return this.requestLogsRepository.complete(input);
  }

  findByRequestId(requestId: string) {
    return this.requestLogsRepository.findByRequestId(requestId);
  }
}
