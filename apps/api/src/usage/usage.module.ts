import { Module } from '@nestjs/common';
import { UsageRecordsRepository } from './repositories/usage-records.repository';
import { TokenEstimatorService } from './services/token-estimator.service';
import { TokenUsageNormalizerService } from './services/token-usage-normalizer.service';
import { UsageService } from './services/usage.service';

@Module({
  providers: [UsageService, TokenUsageNormalizerService, TokenEstimatorService, UsageRecordsRepository],
  exports: [UsageService, TokenUsageNormalizerService, TokenEstimatorService],
})
export class UsageModule {}
