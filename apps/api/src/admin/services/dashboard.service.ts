import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { DashboardSummaryDto } from '../dto/dashboard-summary.dto';

const recentRequestInclude = {
  model: { select: { name: true } },
  provider: { select: { name: true } },
} satisfies Prisma.RequestLogInclude;

type RecentRequestLog = Prisma.RequestLogGetPayload<{
  include: typeof recentRequestInclude;
}>;

type RecentErrorLog = Prisma.ErrorLogGetPayload<Record<string, never>>;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<DashboardSummaryDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User was not found.');
    }

    const usageAggregate = await this.prisma.usageRecord.aggregate({
      where: { userId },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        costCreditsMicro: true,
      },
    });

    const recentRequests = await this.prisma.requestLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: recentRequestInclude,
    });

    const recentErrors = await this.prisma.errorLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      balance: this.mapBalance(user.balanceCreditsMicro, user.freeCreditsMicro),
      usageTotals: {
        promptTokens: usageAggregate._sum.promptTokens ?? 0,
        completionTokens: usageAggregate._sum.completionTokens ?? 0,
        totalTokens: usageAggregate._sum.totalTokens ?? 0,
        costCreditsMicro: (usageAggregate._sum.costCreditsMicro ?? 0n).toString(),
      },
      recentRequests: recentRequests.map((request: RecentRequestLog) =>
        this.mapRecentRequest(request),
      ),
      recentErrors: recentErrors.map((error: RecentErrorLog) =>
        this.mapRecentError(error),
      ),
    };
  }

  private mapBalance(
    balanceCreditsMicro: bigint,
    freeCreditsMicro: bigint,
  ): DashboardSummaryDto['balance'] {
    return {
      balanceCreditsMicro: balanceCreditsMicro.toString(),
      freeCreditsMicro: freeCreditsMicro.toString(),
      totalCreditsMicro: (balanceCreditsMicro + freeCreditsMicro).toString(),
    };
  }

  private mapRecentRequest(
    request: RecentRequestLog,
  ): DashboardSummaryDto['recentRequests'][number] {
    return {
      requestId: request.requestId,
      model: request.model?.name ?? null,
      provider: request.provider?.name ?? null,
      status: request.status,
      latencyMs: request.latencyMs,
      stream: request.stream,
      createdAt: request.createdAt.toISOString(),
      errorCode: request.errorCode,
    };
  }

  private mapRecentError(
    error: RecentErrorLog,
  ): DashboardSummaryDto['recentErrors'][number] {
    return {
      requestId: error.requestId,
      errorType: error.errorType,
      errorCode: error.errorCode,
      message: error.message,
      providerName: error.providerName,
      createdAt: error.createdAt.toISOString(),
    };
  }
}
