import { Injectable } from '@nestjs/common';
import { RequestLogsRepository } from '../repositories/request-logs.repository';

@Injectable()
export class RequestLogService {
  constructor(private readonly requestLogsRepository: RequestLogsRepository) {}

  findByRequestId(requestId: string) {
    return this.requestLogsRepository.findByRequestId(requestId);
  }
}
