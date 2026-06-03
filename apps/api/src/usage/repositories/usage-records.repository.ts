import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateUsageRecordInput } from '../types/token-usage.type';

@Injectable()
export class UsageRecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateUsageRecordInput) {
    return this.prisma.usageRecord.create({
      data: {
        requestId: input.requestId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        modelId: input.modelId,
        providerId: input.providerId,
        providerModel: input.providerModel,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        totalTokens: input.totalTokens,
        costCreditsMicro: input.costCreditsMicro,
        providerCostMicro: input.providerCostMicro ?? 0n,
        status: input.status ?? 'COMPLETED',
      },
    });
  }

  findRecentForUser(userId: string) {
    return this.prisma.usageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
