import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { DashboardSummaryDto } from '../dto/dashboard-summary.dto';

// DashboardService 像“后台账房先生”：它负责把余额、用量、请求日志、错误日志整理成一张仪表盘报表。
@Injectable()
export class DashboardService {
  constructor(
    // PrismaService 像“数据库遥控器”，我们通过它去查 PostgreSQL。
    private readonly prisma: PrismaService,
  ) {}

  // 给当前登录用户生成仪表盘汇总。
  async getSummary(userId: string): Promise<DashboardSummaryDto> {
    console.log(`[系统提示] 正在加载用量与日志面板，用户ID：${userId}`);

    // 第一步：查询当前用户，用来拿余额。
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log('[系统提示] 没找到当前用户，无法加载仪表盘。');
      throw new NotFoundException('User was not found.');
    }

    console.log('[系统提示] 已读取用户余额，准备统计 token 用量。');

    // 第二步：统计当前用户所有 usage_records 的 token 和费用总和。
    const usageTotals = await this.prisma.usageRecord.aggregate({
      where: { userId },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        costCreditsMicro: true,
      },
    });

    console.log('[系统提示] token 用量统计完成，准备读取最近请求日志。');

    // 第三步：读取最近 10 条请求日志，并带上模型名和 provider 名。
    const recentRequests = await this.prisma.requestLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        model: { select: { name: true } },
        provider: { select: { name: true } },
      },
    });

    console.log('[系统提示] 最近请求日志读取完成，准备读取最近错误日志。');

    // 第四步：读取最近 10 条错误日志。
    const recentErrors = await this.prisma.errorLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    console.log('[系统提示] 用量与日志面板数据整理完成，准备返回给前端。');

    // 第五步：把数据库里的 BigInt 和 Date 转成前端安全的字符串。
    return {
      balance: {
        balanceCreditsMicro: user.balanceCreditsMicro.toString(),
        freeCreditsMicro: user.freeCreditsMicro.toString(),
        totalCreditsMicro: (user.balanceCreditsMicro + user.freeCreditsMicro).toString(),
      },
      usageTotals: {
        promptTokens: usageTotals._sum.promptTokens ?? 0,
        completionTokens: usageTotals._sum.completionTokens ?? 0,
        totalTokens: usageTotals._sum.totalTokens ?? 0,
        costCreditsMicro: (usageTotals._sum.costCreditsMicro ?? 0n).toString(),
      },
      recentRequests: recentRequests.map((item) => ({
        requestId: item.requestId,
        model: item.model?.name ?? null,
        provider: item.provider?.name ?? null,
        status: item.status,
        latencyMs: item.latencyMs,
        stream: item.stream,
        createdAt: item.createdAt.toISOString(),
        errorCode: item.errorCode,
      })),
      recentErrors: recentErrors.map((item) => ({
        requestId: item.requestId,
        errorType: item.errorType,
        errorCode: item.errorCode,
        message: item.message,
        providerName: item.providerName,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
