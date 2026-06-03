import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { BillingChargeInput, BillingChargeResult } from '../types/billing-result.type';
import { BalanceService } from './balance.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly prisma: PrismaService,
  ) {}

  async assertCanSpend(userId: string): Promise<void> {
    if (!(await this.balanceService.hasPositiveBalance(userId))) {
      throw new HttpException('Insufficient quota.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async chargeUsage(input: BillingChargeInput): Promise<BillingChargeResult> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new HttpException('Insufficient quota.', HttpStatus.TOO_MANY_REQUESTS);

      const charge = input.costCreditsMicro;
      if (user.freeCreditsMicro + user.balanceCreditsMicro < charge) {
        throw new HttpException('Insufficient quota.', HttpStatus.TOO_MANY_REQUESTS);
      }

      const freeCreditsUsedMicro = charge <= user.freeCreditsMicro ? charge : user.freeCreditsMicro;
      const paidCreditsUsedMicro = charge - freeCreditsUsedMicro;
      const updatedUser = await tx.user.update({
        where: { id: input.userId },
        data: {
          freeCreditsMicro: { decrement: freeCreditsUsedMicro },
          balanceCreditsMicro: { decrement: paidCreditsUsedMicro },
        },
      });

      const usageRecord = await tx.usageRecord.create({
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

      await tx.balanceTransaction.create({
        data: {
          userId: input.userId,
          type: 'USAGE_CHARGE',
          amountCreditsMicro: -charge,
          balanceAfterCreditsMicro: updatedUser.freeCreditsMicro + updatedUser.balanceCreditsMicro,
          referenceType: 'USAGE_RECORD',
          referenceId: usageRecord.id,
          description: `Usage charge for request ${input.requestId}`,
        },
      });

      return {
        usageRecordId: usageRecord.id,
        chargedCreditsMicro: charge,
        freeCreditsUsedMicro,
        paidCreditsUsedMicro,
        balanceAfterCreditsMicro: updatedUser.freeCreditsMicro + updatedUser.balanceCreditsMicro,
      };
    });
  }
}
