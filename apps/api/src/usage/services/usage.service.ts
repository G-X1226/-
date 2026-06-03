import { Injectable } from '@nestjs/common';
import { UsageRecordsRepository } from '../repositories/usage-records.repository';

@Injectable()
export class UsageService {
  constructor(private readonly usageRecordsRepository: UsageRecordsRepository) {}

  getRecentUsage(userId: string) {
    return this.usageRecordsRepository.findRecentForUser(userId);
  }
}
