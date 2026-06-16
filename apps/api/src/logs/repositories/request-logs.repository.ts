import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { CompleteRequestLogInput, StartRequestLogInput } from '../types/request-log-entry.type';

@Injectable()
export class RequestLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: StartRequestLogInput) {
    return this.prisma.requestLog.create({
      data: {
        requestId: input.requestId,
        userId: input.userId,
        apiKeyId: input.apiKeyId,
        modelId: input.modelId,
        providerId: input.providerId,
        endpoint: input.endpoint,
        method: input.method,
        stream: input.stream,
        clientIp: input.clientIp,
        userAgent: input.userAgent,
      },
    });
  }

  complete(input: CompleteRequestLogInput) {
    return this.prisma.requestLog.update({
      where: { requestId: input.requestId },
      data: {
        modelId: input.modelId,
        providerId: input.providerId,
        latencyMs: input.latencyMs,
        upstreamLatencyMs: input.upstreamLatencyMs,
        upstreamStatusCode: input.upstreamStatusCode,
        errorCode: input.errorCode,
        status: input.status,
      },
    });
  }

  findByRequestId(requestId: string) {
    return this.prisma.requestLog.findUnique({ where: { requestId } });
  }
}
