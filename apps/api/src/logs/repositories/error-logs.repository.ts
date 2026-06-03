import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CreateErrorLogInput } from '../types/error-log-entry.type';

@Injectable()
export class ErrorLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateErrorLogInput) {
    return this.prisma.errorLog.create({
      data: {
        requestId: input.requestId,
        requestLogId: input.requestLogId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        errorType: input.errorType,
        errorCode: input.errorCode,
        message: input.message,
        providerName: input.providerName,
        upstreamStatusCode: input.upstreamStatusCode,
        metadata: input.metadata,
      },
    });
  }

  findRecent() {
    return this.prisma.errorLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
