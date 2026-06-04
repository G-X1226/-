import { Injectable } from '@nestjs/common';
import { UsageRecordsRepository } from '../repositories/usage-records.repository';
import type { CreateUsageRecordInput } from '../types/token-usage.type';

@Injectable()
export class UsageService {
  constructor(private readonly usageRecordsRepository: UsageRecordsRepository) {}

  record(input: CreateUsageRecordInput) {
    return this.usageRecordsRepository.create(input);
  }

  getRecentUsage(userId: string) {
    return this.usageRecordsRepository.findRecentForUser(userId);
  }
}
